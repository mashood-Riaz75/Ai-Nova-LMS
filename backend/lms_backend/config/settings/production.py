import os

import dj_database_url
from django.core.exceptions import ImproperlyConfigured

from .dev import *

SECRET_KEY = os.environ["SECRET_KEY"]

DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = [
    "ai-nova-lms-production.up.railway.app",
]
CSRF_TRUSTED_ORIGINS = [
    "https://ai-nova-lms-production.up.railway.app",
]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "").strip()
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "").strip()

if not all((CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)):
    raise ImproperlyConfigured(
        "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and "
        "CLOUDINARY_API_SECRET must be configured for production media storage."
    )

STORAGES = {
    "default": {
        "BACKEND": "apps.users.storage.CloudinaryMediaStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

DATABASES = {
    "default": dj_database_url.config(
        default=os.environ.get("DATABASE_URL"),
        conn_max_age=600,
    )
}

CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in [os.environ.get("FRONTEND_URL", "")]
    if origin and origin.strip()
]
EMAIL_TIMEOUT = 15

BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "").strip()
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "").strip()

if not BREVO_API_KEY:
    raise ImproperlyConfigured(
        "BREVO_API_KEY must be configured for production email delivery."
    )

if not DEFAULT_FROM_EMAIL:
    raise ImproperlyConfigured(
        "DEFAULT_FROM_EMAIL must be configured with a verified Brevo sender."
    )

EMAIL_BACKEND = "anymail.backends.brevo.EmailBackend"
ANYMAIL = {"BREVO_API_KEY": BREVO_API_KEY}

CELERY_BROKER_URL = (
    os.environ.get("CELERY_BROKER_URL", "").strip()
    or os.environ.get("REDIS_URL", "").strip()
)

if not CELERY_BROKER_URL:
    raise ImproperlyConfigured(
        "CELERY_BROKER_URL or REDIS_URL must be configured for production tasks."
    )