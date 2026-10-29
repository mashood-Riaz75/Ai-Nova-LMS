import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("lms.audit")


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
    max_retries=5,
)
def send_student_credentials_email(
    self,
    recipient_email,
    subject,
    message,
):
    """Send student credentials asynchronously, retrying failures."""

    sent_count = send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient_email],
        fail_silently=False,
    )

    if sent_count != 1:
        raise RuntimeError(
            f"Email was not accepted for {recipient_email}"
        )

    logger.info(
        "[EMAIL DISPATCH] Email accepted by SMTP for %s",
        recipient_email,
    )

    return True