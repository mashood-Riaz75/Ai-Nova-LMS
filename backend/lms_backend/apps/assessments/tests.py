from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.users.models import User
from .models import (
    Assessment,
    AssessmentAssignment,
    Option,
    Question,
    StudentAssessmentAttempt,
    StudentQuestionState,
)
from .serializers import AssessmentWriteSerializer


class AssessmentModuleTests(APITestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(email='teacher@example.com', password='password123', role=User.Role.TEACHER)
        self.student = User.objects.create_user(email='student@example.com', password='password123', role=User.Role.STUDENT)
        self.assessment = Assessment.objects.create(
            title='Math Quiz',
            topic='Algebra',
            description='Sample assessment',
            start_time=timezone.now() - timezone.timedelta(minutes=10),
            end_time=timezone.now() + timezone.timedelta(hours=1),
            created_by=self.teacher,
            status=Assessment.Status.PUBLISHED,
        )

    def test_teacher_can_delete_assessment(self):
        self.client.force_authenticate(self.teacher)
        url = reverse('assessments:assessment-detail', kwargs={'assessment_id': self.assessment.id})

        response = self.client.delete(url)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Assessment.objects.filter(id=self.assessment.id).exists())

    def test_student_quit_saves_progress_and_allows_resume(self):
        attempt = StudentAssessmentAttempt.objects.create(
            student=self.student,
            assessment=self.assessment,
            status=StudentAssessmentAttempt.Status.IN_PROGRESS,
            started_at=timezone.now(),
        )
        question = Question.objects.create(
            assessment=self.assessment,
            prompt='2+2',
            marks=1,
        )
        next_question = Question.objects.create(
            assessment=self.assessment,
            prompt='3+3',
            marks=1,
        )
        correct_option = Option.objects.create(
            question=question,
            text='4',
            is_correct=True,
        )
        first_state = StudentQuestionState.objects.create(
            attempt=attempt,
            question=question,
            order_index=1,
        )
        StudentQuestionState.objects.create(
            attempt=attempt,
            question=next_question,
            order_index=2,
        )

        self.client.force_authenticate(self.student)
        submit_url = reverse(
            'assessments:submit-answer',
            kwargs={'assessment_id': self.assessment.id},
        )
        answer_response = self.client.post(
            submit_url,
            {
                'state_id': first_state.id,
                'option_id': correct_option.id,
            },
        )
        self.assertEqual(answer_response.status_code, 200)

        quit_url = reverse('assessments:quit-assessment', kwargs={'assessment_id': self.assessment.id})
        response = self.client.post(quit_url)

        self.assertEqual(response.status_code, 200)
        attempt.refresh_from_db()
        self.assertEqual(attempt.status, StudentAssessmentAttempt.Status.IN_PROGRESS)
        self.assertIsNone(attempt.completed_at)

        questions_url = reverse('assessments:student-assessment-questions', kwargs={'assessment_id': self.assessment.id})
        resume_response = self.client.get(questions_url)
        self.assertEqual(resume_response.status_code, 200)
        self.assertEqual(resume_response.data['current_question_index'], 1)
        self.assertTrue(resume_response.data['questions'][0]['is_answered'])
        self.assertEqual(resume_response.data['questions'][1]['question']['id'], str(next_question.id))

    def test_assigned_students_results_count_each_question_once(self):
        second_student = User.objects.create_user(
            email='second-student@example.com',
            password='password123',
            role=User.Role.STUDENT,
        )
        AssessmentAssignment.objects.bulk_create([
            AssessmentAssignment(
                assessment=self.assessment,
                student=student,
            )
            for student in (self.student, second_student)
        ])
        questions = [
            Question(
                assessment=self.assessment,
                prompt=f'Question {index}',
                marks=1,
            )
            for index in range(30)
        ]
        questions = Question.objects.bulk_create(questions)

        attempts = [
            StudentAssessmentAttempt.objects.create(
                student=student,
                assessment=self.assessment,
                status=StudentAssessmentAttempt.Status.SUBMITTED,
                started_at=timezone.now(),
                completed_at=timezone.now(),
            )
            for student in (self.student, second_student)
        ]
        StudentQuestionState.objects.bulk_create([
            StudentQuestionState(
                attempt=attempt,
                question=question,
                order_index=index + 1,
            )
            for attempt in attempts
            for index, question in enumerate(questions)
        ])
        StudentQuestionState.objects.bulk_create([
            StudentQuestionState(
                attempt=attempts[0],
                question=question,
                order_index=index + 31,
            )
            for index, question in enumerate(questions[:20])
        ])

        self.client.force_authenticate(self.student)
        first_result = self.client.get(reverse(
            'assessments:student-assessment-result',
            kwargs={'attempt_id': attempts[0].id},
        ))
        self.assertEqual(first_result.status_code, 200)
        self.assertEqual(first_result.data['total_questions'], 30)
        self.assertEqual(first_result.data['total_marks'], 30)

        self.client.force_authenticate(second_student)
        second_result = self.client.get(reverse(
            'assessments:student-assessment-result',
            kwargs={'attempt_id': attempts[1].id},
        ))
        self.assertEqual(second_result.status_code, 200)
        self.assertEqual(second_result.data['total_questions'], 30)

    def test_assessment_time_limit_has_a_thirty_minute_minimum(self):
        serializer = AssessmentWriteSerializer(data={
            'title': 'Short Quiz',
            'topic': 'Algebra',
            'time_limit_minutes': 10,
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['time_limit_minutes'], 30)

        self.assessment.time_limit_minutes = 10
        serializer = AssessmentWriteSerializer(
            self.assessment,
            data={'title': 'Updated Quiz'},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['time_limit_minutes'], 30)
