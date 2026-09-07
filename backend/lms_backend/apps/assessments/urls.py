from django.urls import path

from .views import (
    AssessmentListView,
    AssessmentDetailView,
    CreateAssessmentWithAIView,
    AssignAssessmentView,
    StudentAssignedAssessmentsView,
    StudentAssessmentQuestionsView,
    StartAssessmentView,
    CurrentQuestionView,
    SubmitAnswerView,
    SubmitStudentMcqView,
    QuitAssessmentView,
    StudentAssessmentResultView,
    RemoveCompletedAssessmentView,
)


urlpatterns = [

    # --------------------------------------------------------
    # Assessment
    # --------------------------------------------------------

    path(
        '',
        AssessmentListView.as_view(),
        name='assessment-list'
    ),

    path(
        '<uuid:assessment_id>/',
        AssessmentDetailView.as_view(),
        name='assessment-detail'
    ),

    path(
        'create-with-ai/',
        CreateAssessmentWithAIView.as_view(),
        name='create-assessment-with-ai'
    ),

    path(
        '<uuid:assessment_id>/assign/',
        AssignAssessmentView.as_view(),
        name='assign-assessment'
    ),

    # --------------------------------------------------------
    # Student
    # --------------------------------------------------------

    path(
        'student-tasks/',
        StudentAssignedAssessmentsView.as_view(),
        name='student-tasks'
    ),

    path(
        '<uuid:assessment_id>/start/',
        StartAssessmentView.as_view(),
        name='start-assessment'
    ),

    path(
        '<uuid:assessment_id>/questions/',
        StudentAssessmentQuestionsView.as_view(),
        name='student-assessment-questions'
    ),

    path(
        '<uuid:assessment_id>/current-question/',
        CurrentQuestionView.as_view(),
        name='current-question'
    ),

    path(
        '<uuid:assessment_id>/submit-answer/',
        SubmitAnswerView.as_view(),
        name='submit-answer'
    ),

    path(
        '<uuid:assessment_id>/quit/',
        QuitAssessmentView.as_view(),
        name='quit-assessment'
    ),

    # --------------------------------------------------------
    # Remove completed assessment from student's dashboard
    # --------------------------------------------------------

    path(
        '<uuid:assessment_id>/remove/',
        RemoveCompletedAssessmentView.as_view(),
        name='remove-completed-assessment'
    ),

    # --------------------------------------------------------
    # Result
    # --------------------------------------------------------

    path(
        'results/<uuid:attempt_id>/',
        StudentAssessmentResultView.as_view(),
        name='student-assessment-result'
    ),

    # --------------------------------------------------------
    # Legacy endpoint
    # --------------------------------------------------------

    path(
        '<uuid:assessment_id>/submit-mcq/',
        SubmitStudentMcqView.as_view(),
        name='submit-student-mcq'
    ),
]