import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../service/Api';
import { LogOut, GraduationCap, User, ListChecks, BookOpen } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [hasAssigned, setHasAssigned] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkAssigned = async () => {
      try {
        const res = await API.get('/assessments/student-tasks/');
        const items = res.data.results || res.data || [];
        if (!mounted) return;
        setHasAssigned(Array.isArray(items) && items.length > 0);
      } catch (err) {
        // silently ignore — badge is optional
        console.error('Failed to fetch student tasks for badge:', err.response?.data || err);
      }
    };

    // Only check assigned tasks for logged-in students to avoid 403 for other roles
    if (user && user.role === 'STUDENT') {
      checkAssigned();
    }
    // no polling for now; can add interval if desired
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-wide text-white">LMS Portal</span>
      </div>

      {user && (
        <div className="flex items-center space-x-6">
          {user.role === 'STUDENT' && (
            <>
              <Link
                to="/student/dashboard"
                className="flex items-center space-x-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <User className="w-4 h-4 text-indigo-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/student/assessments"
                className="relative flex items-center space-x-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <ListChecks className="w-4 h-4 text-indigo-400" />
                <span>Assessments</span>
                {hasAssigned && (
                  <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-800" />
                )}
              </Link>
            </>
          )}
          {user.role === 'TEACHER' && (
            <Link
              to="/teacher/assessments"
              className="flex items-center space-x-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Assessments</span>
            </Link>
          )}
          <div className="flex items-center space-x-2 text-sm text-slate-300">
            <User className="w-4 h-4 text-indigo-400" />
            <span>{user.first_name || user.email}</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded uppercase font-semibold">
              {user.role}
            </span>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                logout();
              }
            }}
            className="flex items-center space-x-1.5 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}