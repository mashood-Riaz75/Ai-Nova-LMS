import json
import logging

from django.db.models import Q, Sum
from django.utils import timezone

from apps.assessments.models import Assessment, StudentAssessmentAttempt
from apps.users.models import StudentProfile


logger = logging.getLogger('lms.chatbot')


def get_upcoming_assessments(user):
    now = timezone.now()
    visible_assessments = (
        Assessment.objects.filter(
            Q(assigned_to_all_students=True)
            | Q(
                assignments__student=user,
                assignments__is_active=True,
                assignments__is_hidden=False,
            )
        )
        .filter(
            Q(start_time__isnull=True)
            | Q(start_time__gte=now)
            | (
                Q(start_time__lte=now)
                & (Q(end_time__isnull=True) | Q(end_time__gte=now))
            )
        )
        .filter(Q(end_time__isnull=True) | Q(end_time__gte=now))
        .distinct()
        .order_by('start_time', 'title')[:5]
    )
    assessments = list(visible_assessments)
    attempts = {
        attempt.assessment_id: attempt
        for attempt in StudentAssessmentAttempt.objects.filter(
            student=user,
            assessment_id__in=[assessment.id for assessment in assessments],
        )
    }

    data = []
    for assessment in assessments:
        attempt = attempts.get(assessment.id)
        if attempt and attempt.status in (
            StudentAssessmentAttempt.Status.SUBMITTED,
            StudentAssessmentAttempt.Status.EXPIRED,
        ):
            status = 'already_submitted'
        elif assessment.start_time and assessment.start_time > now:
            status = 'not_started_yet'
        else:
            status = 'open_now'

        data.append({
            'title': assessment.title,
            'start': assessment.start_time.isoformat() if assessment.start_time else None,
            'end': assessment.end_time.isoformat() if assessment.end_time else None,
            'status': status,
        })

    return {'assessments': data}


def get_my_results(user):
    attempts = (
        StudentAssessmentAttempt.objects.filter(
            student=user,
            status=StudentAssessmentAttempt.Status.SUBMITTED,
        )
        .select_related('assessment')
        .annotate(total_marks=Sum('question_states__question__marks'))
        .order_by('-completed_at', '-pk')[:5]
    )
    return {
        'results': [
            {
                'title': attempt.assessment.title,
                'score': attempt.score,
                'total': attempt.total_marks or 0,
            }
            for attempt in attempts
        ]
    }


def get_my_profile(user):
    profile = StudentProfile.objects.filter(user=user).first()
    fields = {
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'student_id': profile.student_id if profile else None,
        'grade_level': profile.grade_level if profile else None,
        'department': profile.department if profile else None,
        'date_of_birth': profile.date_of_birth.isoformat() if profile and profile.date_of_birth else None,
        'course': profile.course if profile else None,
        'city': profile.city if profile else None,
        'contact_number': profile.contact_number if profile else None,
    }
    return {
        'name': ' '.join(
            part for part in (user.first_name, user.last_name) if part
        ),
        'email': user.email,
        'missing_fields': [
            field for field, value in fields.items()
            if not value
        ],
    }


CHAT_TOOLS = {
    'get_upcoming_assessments': get_upcoming_assessments,
    'get_my_results': get_my_results,
    'get_my_profile': get_my_profile,
}


def execute_tool(name, user):
    tool = CHAT_TOOLS.get(name)
    if tool is None:
        return json.dumps({'error': 'This request could not be completed. Please contact your teacher.'})

    try:
        return json.dumps(tool(user), default=str)
    except Exception:
        logger.exception('Chatbot tool %s failed', name)
        return json.dumps({'error': 'This information is temporarily unavailable. Please contact your teacher.'})


def has_active_attempt(user):
    return StudentAssessmentAttempt.objects.filter(
        student=user,
        status=StudentAssessmentAttempt.Status.IN_PROGRESS,
    ).exists()
