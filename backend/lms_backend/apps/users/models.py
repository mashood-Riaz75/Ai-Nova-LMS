# apps/users/models.py
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from apps.core.models import TimeStampedModel


class UserManager(BaseUserManager):
    # Ensure create_user is properly indented INSIDE UserManager
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email field is mandatory")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    # Ensure create_superuser is properly indented INSIDE UserManager at the same level
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "TEACHER")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser, TimeStampedModel):
    class Role(models.TextChoices):
        TEACHER = "TEACHER", "Teacher"
        STUDENT = "STUDENT", "Student"

    username = None  # Remove username in favor of email login
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"


class StudentProfile(TimeStampedModel):
    class Department(models.TextChoices):
        SCIENCE = "SCIENCE", "Science"
        ARTS = "ARTS", "Arts"
        COMMERCE = "COMMERCE", "Commerce"
        ENGINEERING = "ENGINEERING", "Engineering"
        MEDICAL = "MEDICAL", "Medical"

    class City(models.TextChoices):
        NEW_YORK = "NEW_YORK", "New York"
        LOS_ANGELES = "LOS_ANGELES", "Los Angeles"
        CHICAGO = "CHICAGO", "Chicago"
        HOUSTON = "HOUSTON", "Houston"
        MIAMI = "MIAMI", "Miami"

    class Course(models.TextChoices):
        MATHEMATICS = "MATHEMATICS", "Mathematics"
        ENGLISH = "ENGLISH", "English"
        PHYSICS = "PHYSICS", "Physics"
        CHEMISTRY = "CHEMISTRY", "Chemistry"
        COMPUTER_SCIENCE = "COMPUTER_SCIENCE", "Computer Science"
      

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile"
    )
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    student_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    grade_level = models.CharField(max_length=50, blank=True, null=True)
    department = models.CharField(
        max_length=50,
        choices=Department.choices,
        blank=True,
        null=True,
    )
    city = models.CharField(
        max_length=50,
        choices=City.choices,
        blank=True,
        null=True,
    )
    course = models.CharField(
        max_length=50,
        choices=Course.choices,
        blank=True,
        null=True,
    )
    contact_number = models.CharField(max_length=13, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"Student Profile: {self.user.email}"