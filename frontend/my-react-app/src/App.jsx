
import { lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const TeacherDashboardPage = lazy(() => import('./pages/TeacherDashboardPage'));
const TeacherAssessmentsPage = lazy(() => import('./pages/TeacherAssessmentsPage'));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage'));
const StudentAssessmentsPage = lazy(() => import('./pages/StudentAssessmentsPage'));
const StudentExamPage = lazy(() => import('./pages/StudentExamPage'));
const StudentResultsPage = lazy(() => import('./pages/StudentResultsPage'));

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
              Loading...
            </div>
          }
        >
          <Routes>
            {/* Public Home Page */}
            <Route path="/" element={<HomePage />} />

            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Teacher Routes */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <TeacherDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teacher/assessments"
              element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <TeacherAssessmentsPage />
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/assessments"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentAssessmentsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/exam/:examId"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentExamPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/results/:attemptId"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentResultsPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        <ToastContainer />
      </Router>
    </AuthProvider>
  );
}

