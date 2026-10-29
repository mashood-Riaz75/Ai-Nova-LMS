import logging
import secrets
import string

from django.apps import apps
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.users.tasks import send_student_credentials_email

logger = logging.getLogger("lms.audit")

User = get_user_model()


def generate_temp_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


@receiver(post_save, sender=User)
def on_student_user_created(sender, instance, created, **kwargs):
    if not created or getattr(instance, "role", None) != User.Role.STUDENT:
        return

    StudentProfile = apps.get_model("users", "StudentProfile")

    raw_password = getattr(instance, "_raw_password", None)

    if not raw_password:
        raw_password = generate_temp_password()
        instance.set_password(raw_password)
        User.objects.filter(pk=instance.pk).update(
            password=instance.password
        )

    profile, _ = StudentProfile.objects.get_or_create(user=instance)

    if not profile.student_id:
        profile.student_id = f"S{instance.pk:06d}"
        profile.save(update_fields=["student_id"])

    logger.info(
        "[AUDIT] New Student Account Created: ID=%s | Email=%s",
        instance.pk,
        instance.email,
    )

    if not instance.email:
        logger.warning(
            "[EMAIL SKIPPED] Student %s has no email address",
            instance.pk,
        )
        return

    email_subject = "Your LMS Student Credentials"
    email_body = (
        f"Hello {instance.first_name or 'Student'},\n\n"
        "Your student account has been created by your teacher.\n\n"
        f"Student ID: {profile.student_id}\n"
        f"Login Email: {instance.email}\n"
        f"Password: {raw_password}\n\n"
        "Please log in and update your profile."
    )

    # Capture plain values before the transaction callback runs.
    recipient_email = instance.email
    subject = email_subject
    message = email_body

    def enqueue_student_email():
        try:
            result = send_student_credentials_email.delay(
                recipient_email=recipient_email,
                subject=subject,
                message=message,
            )
            logger.info(
                "[EMAIL QUEUED] Task ID=%s | Recipient=%s",
                result.id,
                recipient_email,
            )
        except Exception:
            logger.exception(
                "[EMAIL QUEUE ERROR] Could not queue email for %s",
                recipient_email,
            )

    transaction.on_commit(enqueue_student_email)
