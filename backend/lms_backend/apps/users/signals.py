
# apps/users/signals.py

import logging
import secrets
import string
from threading import Thread

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.apps import apps
from django.db import transaction

logger = logging.getLogger("lms.audit")


def generate_temp_password(length=12):
    """Generate a secure temporary password for new students."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


User = get_user_model()


@receiver(post_save, sender=User)
def on_student_user_created(sender, instance, created, **kwargs):

    if not created or getattr(instance, "role", None) != User.Role.STUDENT:
        return

    # Resolve StudentProfile dynamically to avoid circular imports.
    StudentProfile = apps.get_model("users", "StudentProfile")

    # Generate a temporary password if one wasn't supplied by the creator.
    raw_password = getattr(instance, "_raw_password", None)

    if not raw_password:
        raw_password = generate_temp_password()
        instance.set_password(raw_password)

        # Update the password hash without triggering post_save again.
        User.objects.filter(pk=instance.pk).update(
            password=instance.password
        )

    # Create the linked student profile.
    profile, profile_created = StudentProfile.objects.get_or_create(
        user=instance
    )

    # Generate a stable student ID if one is missing.
    if not profile.student_id:
        profile.student_id = f"S{instance.id:06d}"
        profile.save(update_fields=["student_id"])

    logger.info(
        "[AUDIT] New Student Account Created: ID=%s | Email=%s",
        instance.id,
        instance.email,
    )

    # No email address means there is no recipient to notify.
    if not instance.email:
        logger.warning(
            "[EMAIL SKIPPED] Student ID=%s has no email address.",
            instance.id,
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

    # Capture values now so the background task doesn't depend on
    # a subsequently modified model instance.
    recipient_email = instance.email
    sender_email = getattr(
        settings,
        "DEFAULT_FROM_EMAIL",
        "webmaster@localhost",
    )

    def send_student_credentials():
        try:
            sent = send_mail(
                subject=email_subject,
                message=email_body,
                from_email=sender_email,
                recipient_list=[recipient_email],
                fail_silently=False,
            )

            if sent:
                logger.info(
                    "[EMAIL DISPATCH] Credentials email accepted for %s",
                    recipient_email,
                )
            else:
                logger.error(
                    "[EMAIL ERROR] No email sent to %s",
                    recipient_email,
                )

        except Exception:
            logger.exception(
                "[EMAIL ERROR] Failed to deliver credentials to %s",
                recipient_email,
            )

    def start_email_thread():
        try:
            email_thread = Thread(
                target=send_student_credentials,
                name=f"student-credentials-{instance.pk}",
                daemon=True,
            )
            email_thread.start()

        except Exception:
            logger.exception(
                "[EMAIL ERROR] Could not start email task for %s",
                recipient_email,
            )

    # Start email delivery only after the database transaction commits.
    transaction.on_commit(start_email_thread)
