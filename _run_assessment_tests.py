import os
import sys

os.chdir("backend/lms_backend")
sys.path.insert(0, os.getcwd())
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.local"
os.environ["DB_ENGINE"] = "django.db.backends.sqlite3"
os.environ["DB_NAME"] = ":memory:"

from django.core.management import execute_from_command_line

execute_from_command_line(
    ["manage.py", "test", "apps.assessments"]
)
