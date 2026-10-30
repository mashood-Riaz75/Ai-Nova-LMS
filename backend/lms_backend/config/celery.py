import os

from celery import Celery

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings.production",
)

app = Celery("lms_backend")

app.config_from_object("django.conf:settings", namespace="CELERY")

app.autodiscover_tasks()
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL") or os.getenv("REDIS_URL")