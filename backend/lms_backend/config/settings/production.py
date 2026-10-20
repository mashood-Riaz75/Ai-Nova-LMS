import os
import dj_database_url
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