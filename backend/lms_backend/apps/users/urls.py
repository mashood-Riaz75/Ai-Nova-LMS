# apps/users/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, TeacherStudentViewSet, StudentSelfProfileViewSet

router = DefaultRouter()
router.register(r"students", TeacherStudentViewSet, basename="teacher-students")
router.register(r"profile", StudentSelfProfileViewSet, basename="student-profile")

urlpatterns = [
    path("login/", LoginView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("", include(router.urls)),
]