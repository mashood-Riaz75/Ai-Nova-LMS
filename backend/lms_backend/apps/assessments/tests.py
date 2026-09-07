from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.users.models import User
from .models import Assessment, Question, StudentAssessmentAttempt, StudentQuestionState


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
        question = Question.objects.create(assessment=self.assessment, prompt='2+2', marks=1)
        StudentQuestionState.objects.create(attempt=attempt, question=question, order_index=1)

        self.client.force_authenticate(self.student)
        quit_url = reverse('assessments:quit-assessment', kwargs={'assessment_id': self.assessment.id})
        response = self.client.post(quit_url)

        self.assertEqual(response.status_code, 200)
        attempt.refresh_from_db()
        self.assertEqual(attempt.status, StudentAssessmentAttempt.Status.IN_PROGRESS)

        questions_url = reverse('assessments:assessment-questions', kwargs={'assessment_id': self.assessment.id})
        resume_response = self.client.get(questions_url)
        self.assertEqual(resume_response.status_code, 200)
        self.assertIn('current_question_index', resume_response.data)
