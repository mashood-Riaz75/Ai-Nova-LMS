from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

from .models import StudentProfile


User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that includes user information
    and role in the login response.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["email"] = user.email
        token["role"] = user.role

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "role": self.user.role,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
        }

        return data


class LoginResponseSerializer(serializers.Serializer):
    """
    Documents the response returned by the login API.
    """

    access = serializers.CharField()
    refresh = serializers.CharField()
    user = serializers.DictField()


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying student profile information.
    """

    class Meta:
        model = StudentProfile

        fields = [
            "id",
            "avatar",
            "student_id",
            "grade_level",
            "date_of_birth",
            "department",
            "city",
            "course",
            "contact_number",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class StudentAdminSerializer(serializers.ModelSerializer):
    """
    Serializer used by teachers to list, create, retrieve,
    update, and delete student profiles.
    """

    student_profile = StudentProfileSerializer(read_only=True)

    password = serializers.CharField(
        write_only=True,
        required=False
    )

    department = serializers.ChoiceField(
        choices=StudentProfile.Department.choices,
        required=False,
        allow_null=True,
    )

    city = serializers.ChoiceField(
        choices=StudentProfile.City.choices,
        required=False,
        allow_null=True,
    )

    course = serializers.ChoiceField(
        choices=StudentProfile.Course.choices,
        required=False,
        allow_null=True,
    )

    contact_number = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    date_of_birth = serializers.DateField(
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User

        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
            "password",
            "department",
            "city",
            "course",
            "contact_number",
            "date_of_birth",
            "student_profile",
        ]

        read_only_fields = [
            "id",
            "date_joined",
            "student_profile",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password", None)

        profile_data = {
            key: validated_data.pop(key)
            for key in [
                "department",
                "city",
                "course",
                "contact_number",
                "date_of_birth",
            ]
            if key in validated_data
        }

        validated_data["role"] = User.Role.STUDENT

        user = User(**validated_data)

        if password:
            user.set_password(password)

            # Used by signal for email dispatch
            user._raw_password = password

        user.save()

        StudentProfile.objects.update_or_create(
            user=user,
            defaults=profile_data,
        )

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        profile_data = {
            key: validated_data.pop(key)
            for key in [
                "department",
                "city",
                "course",
                "contact_number",
                "date_of_birth",
            ]
            if key in validated_data
        }

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if profile_data:
            profile, _ = StudentProfile.objects.get_or_create(
                user=instance
            )

            for attr, value in profile_data.items():
                setattr(profile, attr, value)

            profile.save()

        return instance


# Alias used by views
StudentCreateSerializer = StudentAdminSerializer


class SelfStudentProfileSerializer(serializers.ModelSerializer):
    """
    Serializer used by students to view and update their
    own profile.
    """

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    role = serializers.CharField(
        source="user.role",
        read_only=True,
    )

    date_joined = serializers.DateTimeField(
        source="user.date_joined",
        read_only=True,
    )

    class Meta:
        model = StudentProfile

        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "avatar",
            "student_id",
            "date_of_birth",
            "course",
            "city",
            "contact_number",
            "date_joined",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "date_joined",
            "updated_at",
        ]