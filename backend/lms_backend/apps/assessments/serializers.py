from datetime import datetime

from django.utils import timezone

from rest_framework import serializers

from .models import (
    Assessment,
    Question,
    Option,
    StudentAssessmentAttempt,
    StudentQuestionState,
    AssessmentAssignment,
)


class EpochDateTimeField(serializers.Field):

    def to_representation(self, value):
        if value in (None, ''):
            return None

        if isinstance(value, datetime):
            return int(value.timestamp())

        return value

    def to_internal_value(self, data):
        if data in (None, ''):
            return None

        if isinstance(data, (int, float)):
            return datetime.fromtimestamp(
                float(data),
                tz=timezone.get_current_timezone()
            )

        if isinstance(data, str):
            value = data.strip()

            if not value:
                return None

            if value.lstrip('-').isdigit():
                return datetime.fromtimestamp(
                    float(value),
                    tz=timezone.get_current_timezone()
                )

            try:
                if value.endswith('Z'):
                    value = value[:-1] + '+00:00'

                parsed = datetime.fromisoformat(value)

                if parsed.tzinfo is None:
                    parsed = timezone.make_aware(
                        parsed,
                        timezone.get_current_timezone()
                    )

                return parsed

            except ValueError as exc:
                raise serializers.ValidationError(
                    'Invalid datetime value.'
                ) from exc

        raise serializers.ValidationError(
            'Invalid datetime value.'
        )


class OptionStudentSerializer(serializers.ModelSerializer):
    """
    Student serializer intentionally excludes is_correct.
    """

    class Meta:
        model = Option
        fields = [
            'id',
            'text',
        ]


class QuestionStudentSerializer(serializers.ModelSerializer):

    options = OptionStudentSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Question
        fields = [
            'id',
            'prompt',
            'difficulty',
            'marks',
            'options',
        ]


class StudentQuestionStateSerializer(serializers.ModelSerializer):

    question = QuestionStudentSerializer(
        read_only=True
    )

    class Meta:
        model = StudentQuestionState
        fields = [
            'id',
            'order_index',
            'is_answered',
            'question',
        ]


class AssessmentSerializer(serializers.ModelSerializer):

    assigned_student_count = serializers.SerializerMethodField()

    start_time = EpochDateTimeField(
        required=False,
        allow_null=True
    )

    end_time = EpochDateTimeField(
        required=False,
        allow_null=True
    )

    due_date = EpochDateTimeField(
        required=False,
        allow_null=True
    )

    class Meta:
        model = Assessment

        fields = [
            'id',
            'title',
            'topic',
            'description',
            'instructions',
            'start_time',
            'end_time',
            'due_date',
            'time_limit_minutes',
            'total_questions',
            'status',
            'assigned_to_all_students',
            'assigned_student_count',
            'created_at',
            'updated_at',
        ]

    def get_assigned_student_count(self, obj):
        return obj.assignments.filter(
            is_active=True
        ).count()


class AssessmentWriteSerializer(serializers.ModelSerializer):

    start_time = EpochDateTimeField(
        required=False,
        allow_null=True
    )

    end_time = EpochDateTimeField(
        required=False,
        allow_null=True
    )

    due_date = EpochDateTimeField(
        required=False,
        allow_null=True
    )

    class Meta:
        model = Assessment

        fields = [
            'title',
            'topic',
            'description',
            'instructions',
            'start_time',
            'end_time',
            'due_date',
            'time_limit_minutes',
            'total_questions',
            'status',
            'assigned_to_all_students',
        ]


class AssessmentCreateSerializer(
    AssessmentWriteSerializer
):
    pass


class AssessmentAssignmentSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = AssessmentAssignment

        fields = [
            'id',
            'assessment',
            'student',
            'assigned_at',
            'is_active',
            'is_hidden',
        ]