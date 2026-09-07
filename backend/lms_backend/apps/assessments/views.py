import random
import logging

from datetime import timedelta

from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
)

from apps.users.models import User

from .models import (
    Assessment,
    Question,
    Option,
    AssessmentAssignment,
    StudentAssessmentAttempt,
    StudentQuestionState,
)

from .serializers import (
    AssessmentSerializer,
    AssessmentWriteSerializer,
    AssessmentCreateSerializer,
    StudentQuestionStateSerializer,
)

from .services.grok_generator import (
    generate_questions_for_assessment
)


logger = logging.getLogger(
    "lms.assessments"
)


def is_teacher(user):
    return user.role == User.Role.TEACHER


def is_student(user):
    return user.role == User.Role.STUDENT


# ============================================================
# ASSESSMENT LIST
# ============================================================

class AssessmentListView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="List assessments",
        description=(
            "Returns assessments available to "
            "the authenticated user."
        ),
        responses={
            200: AssessmentSerializer(many=True)
        },
    )
    def get(self, request):

        if is_student(request.user):

            assessments = (
                Assessment.objects.filter(
                    assigned_to_all_students=True
                )
                |
                Assessment.objects.filter(
                    assignments__student=request.user,
                    assignments__is_active=True,
                    assignments__is_hidden=False,
                )
            ).distinct()

        else:
            assessments = Assessment.objects.all()

        serializer = AssessmentSerializer(
            assessments.order_by("-created_at"),
            many=True,
        )

        return Response(serializer.data)


# ============================================================
# ASSESSMENT DETAIL / EDIT / DELETE
# ============================================================

class AssessmentDetailView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="Get assessment",
        responses={
            200: AssessmentSerializer,
            404: OpenApiResponse(
                description="Assessment not found."
            ),
        },
    )
    def get(
        self,
        request,
        assessment_id
    ):

        assessment = get_object_or_404(
            Assessment,
            id=assessment_id,
        )

        return Response(
            AssessmentSerializer(
                assessment
            ).data
        )

    @extend_schema(
        summary="Update assessment",
        request=AssessmentWriteSerializer,
        responses={
            200: AssessmentSerializer,
            403: OpenApiResponse(
                description=(
                    "Only teachers can edit assessments."
                )
            ),
        },
    )
    def patch(
        self,
        request,
        assessment_id
    ):

        if not is_teacher(request.user):

            return Response(
                {
                    "detail":
                    "Only teachers can edit assessments."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        assessment = get_object_or_404(
            Assessment,
            id=assessment_id,
        )

        serializer = AssessmentWriteSerializer(
            assessment,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            AssessmentSerializer(
                assessment
            ).data
        )

    @extend_schema(
        summary="Delete assessment",
        responses={
            204: OpenApiResponse(
                description=(
                    "Assessment deleted successfully."
                )
            ),
            403: OpenApiResponse(
                description=(
                    "Only teachers can delete assessments."
                )
            ),
        },
    )
    def delete(
        self,
        request,
        assessment_id
    ):

        if not is_teacher(request.user):

            return Response(
                {
                    "detail":
                    "Only teachers can delete assessments."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        assessment = get_object_or_404(
            Assessment,
            id=assessment_id,
        )

        assessment.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


# ============================================================
# CREATE ASSESSMENT WITH AI
# ============================================================

class CreateAssessmentWithAIView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="Create assessment with AI",
        request=AssessmentCreateSerializer,
        responses={
            201: AssessmentSerializer,
            400: OpenApiResponse(
                description="Invalid assessment data."
            ),
            403: OpenApiResponse(
                description=(
                    "Only teachers can create assessments."
                )
            ),
            500: OpenApiResponse(
                description=(
                    "AI question generation failed."
                )
            ),
        },
    )
    def post(self, request):

        if not is_teacher(request.user):

            return Response(
                {
                    "detail":
                    "Only teachers can create assessments."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AssessmentCreateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        assessment = serializer.save(
            created_by=request.user
        )

        try:

            generate_questions_for_assessment(
                str(assessment.id)
            )

        except Exception as exc:

            logger.exception(
                "AI question generation failed"
            )

            assessment.delete()

            return Response(
                {
                    "error": str(exc)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            AssessmentSerializer(
                assessment
            ).data,
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# ASSIGN ASSESSMENT
# ============================================================

class AssignAssessmentView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="Assign assessment",
        responses={
            200: OpenApiResponse(
                description=(
                    "Assessment assigned successfully."
                )
            ),
            400: OpenApiResponse(
                description="Invalid student data."
            ),
            403: OpenApiResponse(
                description=(
                    "Only teachers can assign assessments."
                )
            ),
        },
    )
    def post(
        self,
        request,
        assessment_id
    ):

        if not is_teacher(request.user):

            return Response(
                {
                    "detail":
                    "Only teachers can assign assessments."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        assessment = get_object_or_404(
            Assessment,
            id=assessment_id,
        )

        student_ids = request.data.get(
            "student_ids",
            []
        )

        assign_all = request.data.get(
            "assign_to_all_students",
            False
        )

        if assign_all:

            assessment.assigned_to_all_students = True
            assessment.status = (
                Assessment.Status.ASSIGNED
            )

            assessment.save()

            return Response({
                "detail":
                "Assessment assigned to all students."
            })

        students = User.objects.filter(
            id__in=student_ids,
            role=User.Role.STUDENT,
        )

        if not students.exists():

            return Response(
                {
                    "detail":
                    "No valid students found."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        AssessmentAssignment.objects.filter(
            assessment=assessment
        ).delete()

        AssessmentAssignment.objects.bulk_create([
            AssessmentAssignment(
                assessment=assessment,
                student=student,
            )
            for student in students
        ])

        assessment.assigned_to_all_students = False
        assessment.status = (
            Assessment.Status.ASSIGNED
        )

        assessment.save()

        return Response({
            "detail":
            "Assessment assigned successfully.",
            "assigned_count":
            students.count(),
        })


# ============================================================
# STUDENT TASKS
# ============================================================

class StudentAssignedAssessmentsView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="Get student assessments",
        description=(
            "Returns scheduled, active and completed "
            "assessments for the logged-in student."
        ),
        responses={
            200: OpenApiResponse(
                description="Student assessment list."
            )
        },
    )
    def get(self, request):

        if not is_student(request.user):
            return Response([])

        # Explicitly assigned assessments.
        explicit_assessments = (
            Assessment.objects.filter(
                assignments__student=request.user,
                assignments__is_active=True,
                assignments__is_hidden=False,
            )
        )

        # Assessments assigned to everyone.
        all_student_assessments = (
            Assessment.objects.filter(
                assigned_to_all_students=True
            )
        )

        assessments = (
            explicit_assessments
            |
            all_student_assessments
        ).distinct()

        now = timezone.now()

        data = []

        for assessment in assessments:

            attempt = (
                StudentAssessmentAttempt.objects
                .filter(
                    student=request.user,
                    assessment=assessment,
                )
                .first()
            )

            completed = bool(
                attempt
                and attempt.status in [
                    StudentAssessmentAttempt.Status.SUBMITTED,
                    StudentAssessmentAttempt.Status.EXPIRED,
                ]
            )

            is_scheduled = bool(
                assessment.start_time
                and now < assessment.start_time
            )

            is_window_closed = bool(
                assessment.end_time
                and now > assessment.end_time
            )

            can_start = (
                not completed
                and not is_window_closed
                and (
                    not assessment.start_time
                    or now >= assessment.start_time
                )
            )

            data.append({
                "id": str(assessment.id),

                "task": AssessmentSerializer(
                    assessment
                ).data,

                "attempt_id": (
                    str(attempt.id)
                    if attempt
                    else None
                ),

                "is_completed": completed,

                "can_start": can_start,

                "is_scheduled": is_scheduled,

                "is_window_closed": is_window_closed,

                "status": (
                    attempt.status
                    if attempt
                    else "NOT_STARTED"
                ),
            })

        return Response(data)


# ============================================================
# DELETE / HIDE COMPLETED ASSESSMENT FOR STUDENT
# ============================================================

class RemoveCompletedAssessmentView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="Remove completed assessment",
        description=(
            "Allows a student to remove a completed "
            "assessment from their dashboard. "
            "The assessment itself is not deleted."
        ),
        responses={
            200: OpenApiResponse(
                description=(
                    "Assessment removed from dashboard."
                )
            ),
            400: OpenApiResponse(
                description=(
                    "Only completed assessments "
                    "can be removed."
                )
            ),
            403: OpenApiResponse(
                description=(
                    "Only students can remove "
                    "completed assessments."
                )
            ),
        },
    )
    def delete(
        self,
        request,
        assessment_id
    ):

        if not is_student(request.user):

            return Response(
                {
                    "detail":
                    "Only students can remove assessments."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        attempt = get_object_or_404(
            StudentAssessmentAttempt,
            student=request.user,
            assessment_id=assessment_id,
        )

        if attempt.status not in [
            StudentAssessmentAttempt.Status.SUBMITTED,
            StudentAssessmentAttempt.Status.EXPIRED,
        ]:

            return Response(
                {
                    "detail":
                    "Only completed assessments "
                    "can be removed."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        assignment = (
            AssessmentAssignment.objects
            .filter(
                assessment_id=assessment_id,
                student=request.user,
            )
            .first()
        )

        # For explicitly assigned assessments,
        # hide it for this student.
        if assignment:

            assignment.is_hidden = True
            assignment.is_active = False
            assignment.save(
                update_fields=[
                    "is_hidden",
                    "is_active",
                ]
            )

        else:
            # For assign-to-all assessments there is
            # no individual assignment row.
            #
            # We need an individual row so the student's
            # hidden state can be tracked.
            assignment = (
                AssessmentAssignment.objects.create(
                    assessment_id=assessment_id,
                    student=request.user,
                    is_active=False,
                    is_hidden=True,
                )
            )

        return Response({
            "detail":
            "Assessment removed from your dashboard."
        })


# ============================================================
# STUDENT QUESTIONS
# ============================================================

class StudentAssessmentQuestionsView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="Get assessment questions",
        description=(
            "Returns questions for the student's "
            "active assessment attempt."
        ),
        responses={
            200: OpenApiResponse(
                description=(
                    "Assessment questions and "
                    "attempt information."
                )
            ),
            400: OpenApiResponse(
                description=(
                    "Assessment has not been started "
                    "or is completed."
                )
            ),
        },
    )
    def get(
        self,
        request,
        assessment_id
    ):

        assessment = get_object_or_404(
            Assessment,
            id=assessment_id,
        )

        attempt = (
            StudentAssessmentAttempt.objects
            .filter(
                student=request.user,
                assessment=assessment,
            )
            .first()
        )

        if not attempt:

            return Response(
                {
                    "detail":
                    "Start the assessment first."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if attempt.status != (
            StudentAssessmentAttempt.Status.IN_PROGRESS
        ):

            return Response(
                {
                    "detail":
                    "Assessment is not active.",
                    "status":
                    attempt.status,
                    "attempt_id":
                    str(attempt.id),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        time_limit = (
            attempt.started_at
            + timedelta(
                minutes=assessment.time_limit_minutes
            )
        )

        remaining_seconds = max(
            0,
            int(
                (
                    time_limit
                    - timezone.now()
                ).total_seconds()
            ),
        )

        if remaining_seconds <= 0:

            attempt.status = (
                StudentAssessmentAttempt
                .Status
                .EXPIRED
            )

            attempt.completed_at = (
                timezone.now()
            )

            attempt.save()

            return Response(
                {
                    "detail":
                    "Assessment time expired."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        states = (
            StudentQuestionState.objects
            .filter(attempt=attempt)
            .select_related("question")
            .prefetch_related(
                "question__options"
            )
            .order_by("order_index")
        )

        return Response({
            "attempt_id":
            str(attempt.id),

            "status":
            attempt.status,

            "remaining_seconds":
            remaining_seconds,

            "task": {
                "id":
                str(assessment.id),

                "title":
                assessment.title,

                "topic":
                assessment.topic,

                "description":
                assessment.description,

                "instructions":
                assessment.instructions,

                "duration_minutes":
                assessment.time_limit_minutes,

                "start_time":
                assessment.start_time,

                "end_time":
                assessment.end_time,
            },

            "questions":
            StudentQuestionStateSerializer(
                states,
                many=True,
            ).data,
        })


# ============================================================
# START ASSESSMENT
# ============================================================

class StartAssessmentView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="Start assessment",
        responses={
            200: OpenApiResponse(
                description=(
                    "Assessment started successfully."
                )
            ),
            403: OpenApiResponse(
                description=(
                    "Assessment is not available."
                )
            ),
            400: OpenApiResponse(
                description=(
                    "Assessment already completed."
                )
            ),
        },
    )
    def post(
        self,
        request,
        assessment_id
    ):

        if not is_student(request.user):

            return Response(
                {
                    "detail":
                    "Only students can start assessments."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        assessment = get_object_or_404(
            Assessment,
            id=assessment_id,
        )

        assigned = (
            assessment.assigned_to_all_students
            or AssessmentAssignment.objects.filter(
                assessment=assessment,
                student=request.user,
                is_active=True,
                is_hidden=False,
            ).exists()
        )

        if not assigned:

            return Response(
                {
                    "detail":
                    "Assessment not assigned to you."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        now = timezone.now()

        if (
            assessment.start_time
            and now < assessment.start_time
        ):

            return Response(
                {
                    "detail":
                    "Assessment has not started yet.",

                    "start_time":
                    assessment.start_time,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if (
            assessment.end_time
            and now > assessment.end_time
        ):

            return Response(
                {
                    "detail":
                    "Assessment window has closed."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        attempt, created = (
            StudentAssessmentAttempt.objects
            .get_or_create(
                student=request.user,
                assessment=assessment,
                defaults={
                    "started_at": now,
                    "status": (
                        StudentAssessmentAttempt
                        .Status
                        .IN_PROGRESS
                    ),
                },
            )
        )

        if not created and attempt.status != (
            StudentAssessmentAttempt
            .Status
            .IN_PROGRESS
        ):

            return Response(
                {
                    "detail":
                    "Assessment is already completed.",

                    "status":
                    attempt.status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if created:

            questions = list(
                Question.objects.filter(
                    assessment=assessment
                )
            )

            random.shuffle(questions)

            StudentQuestionState.objects.bulk_create([
                StudentQuestionState(
                    attempt=attempt,
                    question=question,
                    order_index=index + 1,
                )
                for index, question
                in enumerate(questions)
            ])

        return Response({
            "attempt_id":
            str(attempt.id),

            "status":
            attempt.status,
        })


# ============================================================
# CURRENT QUESTION
# ============================================================

class CurrentQuestionView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="Get current question",
        description=(
            "Returns the next unanswered question."
        ),
        responses={
            200: StudentQuestionStateSerializer,
            400: OpenApiResponse(
                description=(
                    "Assessment is completed."
                )
            ),
        },
    )
    def get(
        self,
        request,
        assessment_id
    ):

        attempt = get_object_or_404(
            StudentAssessmentAttempt,
            student=request.user,
            assessment_id=assessment_id,
        )

        if attempt.status != (
            StudentAssessmentAttempt
            .Status
            .IN_PROGRESS
        ):

            return Response(
                {
                    "detail":
                    "Assessment is completed.",

                    "score":
                    attempt.score,

                    "attempt_id":
                    str(attempt.id),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        time_limit = (
            attempt.started_at
            + timedelta(
                minutes=attempt.assessment
                .time_limit_minutes
            )
        )

        if timezone.now() >= time_limit:

            attempt.status = (
                StudentAssessmentAttempt
                .Status
                .EXPIRED
            )

            attempt.completed_at = (
                timezone.now()
            )

            attempt.save()

            return Response(
                {
                    "detail":
                    "Assessment time expired.",

                    "score":
                    attempt.score,

                    "attempt_id":
                    str(attempt.id),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        state = (
            StudentQuestionState.objects
            .filter(
                attempt=attempt,
                is_answered=False,
            )
            .select_related("question")
            .prefetch_related(
                "question__options"
            )
            .order_by("order_index")
            .first()
        )

        if not state:

            return Response({
                "detail":
                "All questions completed.",

                "completed":
                True,

                "score":
                attempt.score,

                "attempt_id":
                str(attempt.id),
            })

        return Response(
            StudentQuestionStateSerializer(
                state
            ).data
        )


# ============================================================
# SUBMIT ANSWER
# ============================================================

class SubmitAnswerView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="Submit answer",
        description=(
            "Submits the selected option for a question."
        ),
        responses={
            200: OpenApiResponse(
                description=(
                    "Answer submitted successfully."
                )
            ),
            400: OpenApiResponse(
                description=(
                    "Question already answered "
                    "or attempt inactive."
                )
            ),
        },
    )
    def post(
        self,
        request,
        assessment_id
    ):

        attempt = get_object_or_404(
            StudentAssessmentAttempt,
            student=request.user,
            assessment_id=assessment_id,
        )

        if attempt.status != (
            StudentAssessmentAttempt
            .Status
            .IN_PROGRESS
        ):

            return Response(
                {
                    "detail":
                    "Assessment is not active."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Server-side time validation.
        time_limit = (
            attempt.started_at
            + timedelta(
                minutes=attempt.assessment
                .time_limit_minutes
            )
        )

        if timezone.now() >= time_limit:

            attempt.status = (
                StudentAssessmentAttempt
                .Status
                .EXPIRED
            )

            attempt.completed_at = (
                timezone.now()
            )

            attempt.save()

            return Response(
                {
                    "detail":
                    "Assessment time expired.",

                    "completed":
                    True,

                    "score":
                    attempt.score,

                    "attempt_id":
                    str(attempt.id),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        state = get_object_or_404(
            StudentQuestionState,
            id=request.data.get("state_id"),
            attempt=attempt,
        )

        if state.is_answered:

            return Response(
                {
                    "detail":
                    "Question already answered."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        option = get_object_or_404(
            Option,
            id=request.data.get("option_id"),
            question=state.question,
        )

        state.selected_option = option
        state.is_answered = True
        state.answered_at = timezone.now()

        state.save()

        remaining = (
            StudentQuestionState.objects
            .filter(
                attempt=attempt,
                is_answered=False,
            )
            .exists()
        )

        if not remaining:

            attempt.status = (
                StudentAssessmentAttempt
                .Status
                .SUBMITTED
            )

            attempt.completed_at = (
                timezone.now()
            )

            attempt.score = sum(
                s.question.marks
                for s in (
                    StudentQuestionState.objects
                    .filter(
                        attempt=attempt,
                        is_answered=True,
                        selected_option__is_correct=True,
                    )
                )
            )

            attempt.save()

        return Response({
            "detail":
            "Answer submitted.",

            "completed":
            not remaining,

            "score":
            attempt.score,

            "attempt_id":
            str(attempt.id),
        })


# ============================================================
# OLD SUBMIT ENDPOINT
# ============================================================

class SubmitStudentMcqView(
    SubmitAnswerView
):
    """
    Kept for compatibility with
    the existing frontend.
    """

    pass


# ============================================================
# QUIT ASSESSMENT
# ============================================================

class QuitAssessmentView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="Quit assessment",
        description=(
            "Ends the student's active assessment attempt."
        ),
        responses={
            200: OpenApiResponse(
                description=(
                    "Assessment quit successfully."
                )
            ),
            400: OpenApiResponse(
                description=(
                    "Assessment is already completed."
                )
            ),
        },
    )
    def post(
        self,
        request,
        assessment_id
    ):

        attempt = get_object_or_404(
            StudentAssessmentAttempt,
            student=request.user,
            assessment_id=assessment_id,
        )

        if attempt.status != (
            StudentAssessmentAttempt
            .Status
            .IN_PROGRESS
        ):

            return Response(
                {
                    "detail":
                    "Assessment is already completed."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        attempt.status = (
            StudentAssessmentAttempt
            .Status
            .SUBMITTED
        )

        attempt.completed_at = (
            timezone.now()
        )

        # Calculate score for answered questions
        attempt.score = sum(
            state.question.marks
            for state in (
                StudentQuestionState.objects
                .filter(
                    attempt=attempt,
                    is_answered=True,
                    selected_option__is_correct=True,
                )
            )
        )

        attempt.save()

        return Response({
            "detail":
            "Assessment quit successfully.",

            "attempt_id":
            str(attempt.id),

            "score":
            attempt.score,

            "status":
            attempt.status,
        })


# ============================================================
# RESULT
# ============================================================

class StudentAssessmentResultView(APIView):

    permission_classes = [
        permissions.IsAuthenticated
    ]

    @extend_schema(
        summary="Get assessment result",
        description=(
            "Returns the student's score and assessment result."
        ),
        responses={
            200: OpenApiResponse(
                description="Assessment result."
            ),
            404: OpenApiResponse(
                description="Attempt not found."
            ),
        },
    )
    def get(self, request, attempt_id):

        attempt = get_object_or_404(
            StudentAssessmentAttempt,
            id=attempt_id,
            student=request.user,
        )

        # Calculate total marks for all questions
        total_marks = sum(
            state.question.marks
            for state in attempt.question_states.all()
        )

        return Response({
            "attempt_id": str(attempt.id),

            "exam_title": attempt.assessment.title,

            "score": attempt.score,

            "total_marks": total_marks,

            "status": attempt.status,

            "completed_at": attempt.completed_at,

            "total_questions": attempt.question_states.count(),
        }) 