# apps/users/signals.py
import logging
import secrets
import string
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.apps import apps

logger = logging.getLogger("lms.audit")

def generate_temp_password(length=12):
    """Generates a secure temporary password for new students."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))

User = get_user_model()

@receiver(post_save, sender=User)
def on_student_user_created(sender, instance, created, **kwargs):
    
    if created and getattr(instance, 'role', None) == User.Role.STUDENT:
        # Resolve StudentProfile dynamically to prevent circular imports
        StudentProfile = apps.get_model('users', 'StudentProfile')
        
        # Always generate a random password for newly created students.
        # This avoids showing placeholders in the email and ensures the student
        # receives credentials they can use to log in.
        raw_password = getattr(instance, "_raw_password", None)
        if not raw_password:
            raw_password = generate_temp_password()
            instance.set_password(raw_password)
            # Persist the hashed password without re-triggering post_save
            User.objects.filter(pk=instance.pk).update(password=instance.password)

        # Auto-create linked StudentProfile and ensure a stable student_id
        profile, created = StudentProfile.objects.get_or_create(user=instance)
        # If student_id not set, generate one based on user id
        if not profile.student_id:
            try:
                profile.student_id = f"S{instance.id:06d}"
                profile.save(update_fields=["student_id"])
            except Exception:
                # fallback: generate a random short id
                import secrets
                profile.student_id = secrets.token_hex(6)
                profile.save(update_fields=["student_id"])

        logger.info(f"[AUDIT] New Student Account Created: ID={instance.id} | Email={instance.email}")

        # Dispatch Email Credentials
        if instance.email:
            email_subject = "Your LMS Student Credentials"
            email_body = (
                f"Hello {instance.first_name or 'Student'},\n\n"
                f"Your student account has been created by your teacher.\n\n"
                f"Student ID: {getattr(profile, 'student_id', '[pending]')}\n"
                f"Login Email: {instance.email}\n"
                f"Password: {raw_password}\n\n"
                f"Please log in and update your profile."
            )

            try:
                send_mail(
                    subject=email_subject,
                    message=email_body,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'webmaster@localhost'),
                    recipient_list=[instance.email],
                    fail_silently=False,
                )
                logger.info(f"[EMAIL DISPATCH] Sent login credentials to {instance.email}")
            except Exception as exc:
                logger.error(f"[EMAIL ERROR] Failed to deliver credentials to {instance.email}: {str(exc)}")