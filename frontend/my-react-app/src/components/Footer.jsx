import { ArrowRight, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const linkClassName =
  'w-fit text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-sm';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-14 sm:pt-16">
        <div className="mb-14 flex flex-col gap-6 rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 shadow-xl shadow-indigo-950/20 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-200">
              Your next step starts here
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Make every learning moment count.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">
              Sign in to manage assessments, follow progress, and keep learning moving.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700"
          >
            Access your portal
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-10 border-b border-white/10 pb-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              aria-label="EduLMS home"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                <BookOpen aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold tracking-tight">EduLMS</span>
            </Link>
            <p className="max-w-sm text-sm leading-6 text-slate-400">
              A clearer way for students and teachers to stay connected to learning and progress.
            </p>
          </div>

          <nav aria-label="Platform links">
            <h3 className="mb-4 text-sm font-semibold text-white">Platform</h3>
            <ul className="flex flex-col gap-3">
              <li><Link className={linkClassName} to="/">Home</Link></li>
              <li><Link className={linkClassName} to="/login">Sign in</Link></li>
              <li><Link className={linkClassName} to="/login">Get started</Link></li>
            </ul>
          </nav>

          <nav aria-label="Portal links">
            <h3 className="mb-4 text-sm font-semibold text-white">Portals</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link className={linkClassName} to="/login">
                  <GraduationCap aria-hidden="true" className="mr-2 inline h-4 w-4 text-indigo-300" />
                  Student portal
                </Link>
              </li>
              <li>
                <Link className={linkClassName} to="/login">
                  <BookOpen aria-hidden="true" className="mr-2 inline h-4 w-4 text-indigo-300" />
                  Teacher portal
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EduLMS. All rights reserved.</p>
          <p className="inline-flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-400" />
            A secure space for learning
          </p>
          <a
            href="#top"
            className="w-fit rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
