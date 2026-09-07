import uuid

from django.db import models
from django.conf import settings


class Assessment(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        ASSIGNED = 'ASSIGNED', 'Assigned'
        COMPLETED = 'COMPLETED', 'Completed'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    title = models.CharField(max_length=255)
    topic = models.CharField(max_length=255)

    description = models.TextField(
        blank=True,
        default=''
    )

    instructions = models.TextField(
        blank=True,
        default=''
    )

    start_time = models.DateTimeField(
        null=True,
        blank=True
    )

    end_time = models.DateTimeField(
        null=True,
        blank=True
    )

    due_date = models.DateTimeField(
        null=True,
        blank=True
    )

    time_limit_minutes = models.PositiveIntegerField(
        default=30
    )

    total_questions = models.PositiveIntegerField(
        default=30
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )

    assigned_to_all_students = models.BooleanField(
        default=False
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_assessments'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        db_table = 'assessments_core_assessment'

        indexes = [
            models.Index(
                fields=['start_time', 'end_time']
            ),
        ]

    def __str__(self):
        return f"{self.title} ({self.topic})"


class Question(models.Model):
    class Difficulty(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='questions'
    )

    prompt = models.TextField()

    difficulty = models.CharField(
        max_length=10,
        choices=Difficulty.choices,
        default=Difficulty.MEDIUM
    )

    marks = models.PositiveIntegerField(
        default=1
    )

    class Meta:
        db_table = 'assessments_core_question'

    def __str__(self):
        return f"[{self.difficulty}] {self.prompt[:50]}"


class Option(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options'
    )

    text = models.TextField()

    is_correct = models.BooleanField(
        default=False
    )

    class Meta:
        db_table = 'assessments_core_option'

    def __str__(self):
        return self.text[:50]


class AssessmentAssignment(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='assignments'
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assessment_assignments'
    )

    assigned_at = models.DateTimeField(
        auto_now_add=True
    )

    is_active = models.BooleanField(
        default=True
    )

    # Student can hide a completed assessment
    # without deleting the real assessment.
    is_hidden = models.BooleanField(
        default=False
    )

    class Meta:
        db_table = 'assessments_core_assignment'

        unique_together = (
            'assessment',
            'student'
        )

    def __str__(self):
        return f"{self.assessment.title} -> {self.student.email}"


class StudentAssessmentAttempt(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = 'NOT_STARTED', 'Not Started'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        EXPIRED = 'EXPIRED', 'Expired'

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assessment_attempts'
    )

    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='attempts'
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_STARTED
    )

    score = models.FloatField(
        default=0.0
    )

    started_at = models.DateTimeField(
        null=True,
        blank=True
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'assessments_core_attempt'

        unique_together = (
            'student',
            'assessment'
        )

        indexes = [
            models.Index(
                fields=[
                    'student',
                    'assessment',
                    'status'
                ]
            ),
        ]


class StudentQuestionState(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    attempt = models.ForeignKey(
        StudentAssessmentAttempt,
        on_delete=models.CASCADE,
        related_name='question_states'
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE
    )

    order_index = models.PositiveIntegerField()

    selected_option = models.ForeignKey(
        Option,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    is_answered = models.BooleanField(
        default=False
    )

    answered_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'assessments_core_state'

        unique_together = (
            'attempt',
            'order_index'
        )

        ordering = [
            'order_index'
        ]