import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, ShieldCheck, Award, ArrowRight, UserCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-bold text-slate-800">EduLMS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition"
          >
            Sign In
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full">
          <Award className="w-4 h-4" /> Next-Gen Learning Management System
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
          Empowering Education for <span className="text-indigo-600">Students</span> &amp; <span className="text-indigo-600">Teachers</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Seamlessly manage assessments, view real-time student results, and track academic growth in one secure platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md transition"
          >
            Access Portal <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Role Feature Cards */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Student Box */}
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-xl mb-6">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">For Students</h2>
          <p className="text-slate-600 mb-6">
            Take assigned tests, track your test history, view performance Analytics, and review detailed score breakdowns anytime.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:gap-3 transition-all"
          >
            Student Login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Teacher Box */}
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl mb-6">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">For Teachers</h2>
          <p className="text-slate-600 mb-6">
            Create new assessments, auto-generate student credentials, evaluate results, and monitor class-wide analytics efficiently.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all"
          >
            Teacher Portal <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} LMS Platform. Built with React &amp; Django.
      </footer>
    </div>
  );
}