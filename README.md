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

The frontend expects the API at `http://localhost:8000/api`. Start the backend first, or update `src/service/Api.jsx` when using a different API URL.

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
