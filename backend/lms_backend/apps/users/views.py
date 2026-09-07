import logging
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import (MultiPartParser,FormParser,JSONParser,)
from rest_framework.response import Response

from rest_framework_simplejwt.views import TokenObtainPairView

from drf_spectacular.utils import ( extend_schema,extend_schema_view,)

from .models import User, StudentProfile

from .serializers import ( CustomTokenObtainPairSerializer, LoginResponseSerializer, StudentCreateSerializer,
    StudentAdminSerializer,
    SelfStudentProfileSerializer,
)

from apps.core.permissions import IsTeacher, IsStudent
from apps.core.pagination import StandardResultsSetPagination


logger = logging.getLogger("lms.users")


# ============================================================
# LOGIN
# ============================================================

@extend_schema(
    summary="User Login",
    description=(
        "Authenticates a teacher or student using email and password. "
        "Returns JWT access and refresh tokens along with the "
        "authenticated user's information and role."
    ),
    request=CustomTokenObtainPairSerializer,
    responses=LoginResponseSerializer,
    tags=["Authentication"],
)
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ============================================================
# TEACHER - STUDENT MANAGEMENT
# ============================================================

@extend_schema_view(
    list=extend_schema(
        summary="List Students",
        description=(
            "Returns a paginated list of students. "
            "Only authenticated teachers can access this endpoint."
        ),
        tags=["Students"],
        responses=StudentAdminSerializer,
    ),

    retrieve=extend_schema(
        summary="Retrieve Student",
        description=(
            "Returns the details of a specific student. "
            "Only authenticated teachers can access this endpoint."
        ),
        tags=["Students"],
        responses=StudentAdminSerializer,
    ),

    create=extend_schema(
        summary="Create Student",
        description=(
            "Allows a teacher to create a new student account "
            "and associated student profile."
        ),
        tags=["Students"],
        request=StudentAdminSerializer,
        responses=StudentAdminSerializer,
    ),

    update=extend_schema(
        summary="Update Student",
        description=(
            "Allows a teacher to completely update an existing "
            "student account and profile."
        ),
        tags=["Students"],
        request=StudentAdminSerializer,
        responses=StudentAdminSerializer,
    ),

    partial_update=extend_schema(
        summary="Partially Update Student",
        description=(
            "Allows a teacher to partially update an existing "
            "student account and profile."
        ),
        tags=["Students"],
        request=StudentAdminSerializer,
        responses=StudentAdminSerializer,
    ),

    destroy=extend_schema(
        summary="Delete Student",
        description=(
            "Permanently deletes a student account and its "
            "associated student profile."
        ),
        tags=["Students"],
        responses={204: None},
    ),
)
class TeacherStudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTeacher]
    serializer_class = StudentCreateSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter,]
    search_fields = [  "email", "first_name",  "last_name",]
    filterset_fields = [ "is_active",]
    ordering_fields = ["date_joined", "email", "first_name", "last_name",]
    ordering = ["-date_joined",]

    def get_queryset(self):
        """
        Restrict queryset to users having STUDENT role.
        """

        return (
            User.objects
            .filter(role=User.Role.STUDENT)
            .select_related("student_profile")
        )

    def perform_create(self, serializer):

        student = serializer.save()

        logger.info(
            f"Teacher '{self.request.user.email}' "
            f"created Student '{student.email}'"
        )

    def perform_destroy(self, instance):

        logger.info(
            f"Teacher '{self.request.user.email}' "
            f"deleted Student '{instance.email}'"
        )

        instance.delete()


# ============================================================
# STUDENT SELF PROFILE
# ============================================================

class StudentSelfProfileViewSet(viewsets.GenericViewSet):

    permission_classes = [IsStudent]
    serializer_class = SelfStudentProfileSerializer
    parser_classes = [ MultiPartParser, FormParser,JSONParser, ]
    def get_object(self):
        """
        Returns the StudentProfile associated with
        the currently authenticated student.
        """

        profile, _ = StudentProfile.objects.get_or_create(
            user=self.request.user
        )

        return profile

    @extend_schema(
        summary="View Student Profile",
        description=("Returns the profile information of the ""currently authenticated student." ),
        responses=SelfStudentProfileSerializer,
        tags=["Student Profile"],
        methods=["GET"],
    )
    @extend_schema(
        summary="Update Student Profile",
        description=(
            "Allows the authenticated student to update "
            "their profile information and upload or update "
            "their avatar."
        ),
        request=SelfStudentProfileSerializer,
        responses=SelfStudentProfileSerializer,
        tags=["Student Profile"],
        methods=["PATCH"],
    )
    @action(
        detail=False,
        methods=["get", "patch"],
        url_path="me",
    )
    def me(self, request):

        profile = self.get_object()

        # ----------------------------------------
        # GET PROFILE
        # ----------------------------------------

        if request.method == "GET":

            serializer = self.get_serializer(profile)

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        # ----------------------------------------
        # UPDATE PROFILE
        # ----------------------------------------

        if request.method == "PATCH":

            serializer = self.get_serializer(
                profile,
                data=request.data,
                partial=True,
            )

            serializer.is_valid(
                raise_exception=True
            )

            serializer.save()

            logger.info(
                f"[PROFILE UPDATE] Student "
                f"'{request.user.email}' "
                f"updated profile picture."
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )