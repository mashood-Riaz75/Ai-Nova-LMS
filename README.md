# Learning Management System

A full-stack Ai based learning management system with a Django REST API and a React frontend. The platform supports user authentication, student and teacher dashboards, assessments, quizzes, results, and profile management.

## Project Structure

```text
backend/lms_backend/       Django project and REST API
frontend/my-react-app/     React and Vite frontend
```
 ## Key Features : 

User & Teacher Authentication with secure role-based access.
Separate Dashboards for students and teachers with role-specific functionalities.
Student Profile Management including profile creation and editing.
Email-Based Student Onboarding with automated login credentials sent via email.
Assessment Management System for creating, scheduling, and managing assessments.
AI-Powered Assessment Generation using LLaMA LLM integration.
Scheduled Assessments with proper start/end time management.
Student Assessment Portal for viewing and attempting assigned assessments.
Search & Filtering for efficiently managing students, teachers, and assessments.
Pagination for optimized handling of large datasets.
RESTful APIs developed using Django REST Framework.
Role-Based Access Control (RBAC) to protect resources and functionality.
AI Integration to automate and enhance assessment creation.
Complete LMS Workflow covering user management, learning assessments, scheduling, and AI-assisted content generation.


## Requirements

- Python 3.10+
- Node.js 18+
- npm
- PostgreSQL for the configured backend database

## Backend Setup

```powershell
cd backend/lms_backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r .requirement.txt
python manage.py migrate
python manage.py runserver
```

Create a `.env` file in `backend/lms_backend/` with the database and application settings required by your environment. Do not commit this file.

The backend currently references `config.settings.stage`, but this settings module is not present in the repository. Before starting Django, update the project and settings entrypoints to use an available module such as `config.settings.local`.

## Frontend Setup

```powershell
cd frontend/my-react-app
npm install
npm run dev
```

The frontend uses `VITE_API_BASE_URL` as the backend origin and appends `/api` automatically. For local development, it defaults to `http://localhost:8000`; in production, it defaults to `https://ai-nova-lms-production.up.railway.app`. Set `VITE_API_BASE_URL` in the frontend hosting provider's build environment if the backend is hosted elsewhere. Set only the origin (for example, `https://api.example.com`), without `/api`.

## Student Support Chat

The student dashboard includes a support chat for the signed-in student's assessment schedule/status, submitted results, and profile information. It is not a course-material tutor. The endpoint requires a student JWT and accepts:

```http
POST /api/chat/
Authorization: Bearer <access-token>
Content-Type: application/json

{"message": "When is my next assessment?"}
```

`message` is required, trimmed, and limited to 1000 characters. `session_id` is optional; conversations are private to the authenticated student. Successful replies contain `reply` and `session_id`. Chat requests are limited to 20 per minute per user. The Groq-backed tools only read the student's own profile, assignments, and results.

Configure `GROQ_API_KEY` in the backend environment. `GROQ_MODEL` is optional and defaults to the existing `openai/gpt-oss-120b` model. The chatbot reuses the project's OpenAI-compatible Groq API endpoint and adds no dependency or infrastructure.

After updating the backend, run these commands from `backend/lms_backend`:

```powershell
python manage.py migrate
python manage.py test apps.chatbot
```

## Production Email and Background Tasks

Production email is sent through Brevo and student credential emails are queued with Celery. Configure these variables on both the backend web service and its Celery worker:

- `BREVO_API_KEY`: Brevo API key.
- `DEFAULT_FROM_EMAIL`: sender address verified in Brevo.
- `CELERY_BROKER_URL` or `REDIS_URL`: connection URL for the same Redis service.

The backend now fails to start if any required setting is missing instead of silently using the local console email backend. Deploy a separate worker using the same backend code, environment variables, and working directory (`backend/lms_backend`), with this start command:

```powershell
celery -A config worker --loglevel=info
```

In the web service logs, `[EMAIL QUEUED]` means Redis accepted the task; in the worker logs, `[EMAIL DISPATCH]` means the email backend accepted it. Check Brevo's email activity for final delivery status.

## Production Profile Images

Production avatars are stored in Cloudinary so they remain available across Railway deployments. Add these environment variables to both the Railway backend web service and its Celery worker before deploying:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Find these values in the Cloudinary dashboard. Keep the API secret private and never commit it. The application fails to start in production if these credentials are missing. Local development continues to store uploaded media under `backend/lms_backend/media`.

## Useful Commands

```powershell
# Frontend production build
cd frontend/my-react-app
npm run build

# Backend tests
cd backend/lms_backend
python manage.py runserver
```

## Publishing to GitHub

From the project root:

```powershell
git init
git add .
git commit -m "Initial project commit"
git branch -M main
git remote add origin <your-github-repository-url>
git push -u origin main
```

Review the staged files before committing to confirm that secrets, virtual environments, databases, and dependency folders are excluded.
