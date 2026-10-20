import os
import dj_database_url
from .dev import *

SECRET_KEY = os.environ["SECRET_KEY"]

DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "localhost",
).split(",")

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