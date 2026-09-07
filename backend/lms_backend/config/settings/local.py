import os
from dotenv import load_dotenv
from .dev import *

# Load environment variables from .env
env_path = BASE_DIR / '.env'
if env_path.exists():
    load_dotenv(env_path)

DEBUG = True

ALLOWED_HOSTS = ['*']

# Database Settings
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.getenv('DB_NAME', 'My_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5434'),
    }
}

CORS_ALLOW_ALL_ORIGINS = True