import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Clock3,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import API from '../service/Api';
import Navbar from '../components/Navbar';
import ChatWidget from '../components/ChatWidget';

export default function StudentDashboardPage() {
  const [studentProfile, setStudentProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const res = await API.get('/users/profile/me/');
      setStudentProfile(res.data);
    } catch (err) {
      console.error("Failed to load student profile:", err.response?.data || err);
    } finally {
      setProfileLoading(false);
    }
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `${API.defaults.baseURL.replace(/\/api\/?$/, '')}${avatarPath}`;
  };

  const handleAvatarSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewAvatarUrl) {
      URL.revokeObjectURL(previewAvatarUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedAvatarFile(file);
    setPreviewAvatarUrl(previewUrl);
  };

  const handleConfirmAvatar = async () => {
    if (!selectedAvatarFile) return;

    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('avatar', selectedAvatarFile);

    try {
      await API.patch('/users/profile/me/', formData);
      await fetchStudentProfile();
      setSelectedAvatarFile(null);
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
        setPreviewAvatarUrl(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Profile picture updated.');
    } catch (err) {
      console.error('Failed to upload avatar:', err.response?.data || err);
      const message =
        err.response?.data?.avatar?.[0] ||
        err.response?.data?.detail ||
        'Unable to update profile picture. Please try again.';
      toast.error(message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCancelAvatar = () => {
    if (previewAvatarUrl) {
      URL.revokeObjectURL(previewAvatarUrl);
      setPreviewAvatarUrl(null);
    }
    setSelectedAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleDeleteAvatar = async () => {
    if (selectedAvatarFile) {
      handleCancelAvatar();
      return;
    }

    if (!studentProfile?.avatar) {
      return;
    }

    if (!window.confirm('Delete your current profile picture?')) {
      return;
    }

    setAvatarUploading(true);
    try {
      await API.patch('/users/profile/me/', { avatar: null });
      await fetchStudentProfile();
    } catch (err) {
      console.error('Failed to delete avatar:', err.response?.data || err);
      toast.error('Unable to delete profile picture.');
    } finally {
      setAvatarUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
      }
    };
  }, [previewAvatarUrl]);

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Your learning space
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Student dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Manage your profile and pick up where your learning left off.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <section
            aria-labelledby="student-profile-heading"
            className="overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-800 shadow-xl shadow-slate-950/20"
          >
            <div className="border-b border-white/5 bg-gradient-to-br from-indigo-500/15 via-slate-800 to-slate-800 p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex shrink-0 flex-col items-center gap-3 sm:items-start">
                  <div className="relative">
                    <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-slate-700 bg-slate-900 shadow-lg shadow-indigo-950/40 ring-2 ring-indigo-400/50">
                      {profileLoading ? (
                        <div className="h-full w-full animate-pulse bg-slate-700" />
                      ) : selectedAvatarFile && previewAvatarUrl ? (
                        <img
                          src={previewAvatarUrl}
                          alt="Selected profile picture preview"
                          className="h-full w-full object-cover"
                        />
                      ) : studentProfile?.avatar ? (
                        <img
                          src={getAvatarUrl(studentProfile.avatar)}
                          alt="Student profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/30 to-slate-800 text-indigo-200">
                          <UserRound aria-hidden="true" className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={profileLoading || avatarUploading}
                      aria-label="Choose a profile picture"
                      title="Choose a profile picture"
                      className="absolute bottom-0 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full border-4 border-slate-800 bg-indigo-500 text-white shadow-lg transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Camera aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    aria-label="Upload profile picture"
                    className="sr-only"
                  />
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                    Student profile
                  </div>
                  {profileLoading ? (
                    <>
                      <div className="mx-auto h-7 w-48 animate-pulse rounded bg-slate-700 sm:mx-0" />
                      <div className="mx-auto mt-3 h-4 w-56 animate-pulse rounded bg-slate-700/70 sm:mx-0" />
                    </>
                  ) : (
                    <>
                      <h2
                        id="student-profile-heading"
                        className="truncate text-2xl font-bold tracking-tight text-white"
                      >
                        {[studentProfile?.first_name, studentProfile?.last_name]
                          .filter(Boolean)
                          .join(' ') || 'Student'}
                      </h2>
                      <p className="mt-1 flex items-center justify-center gap-2 break-all text-sm text-slate-300 sm:justify-start">
                        <Mail aria-hidden="true" className="h-4 w-4 shrink-0 text-indigo-300" />
                        {studentProfile?.email || 'Email not provided'}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
                          {studentProfile?.role || 'STUDENT'}
                        </span>
                        <span className="rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
                          Student ID · {studentProfile?.student_id || 'Not assigned'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
                {selectedAvatarFile ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">New photo selected</p>
                      <p
                        className="truncate text-xs text-slate-400"
                        title={selectedAvatarFile.name}
                      >
                        {selectedAvatarFile.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmAvatar}
                        disabled={avatarUploading}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:cursor-wait disabled:opacity-60 sm:flex-none"
                      >
                        {avatarUploading ? 'Uploading...' : 'Save photo'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelAvatar}
                        disabled={avatarUploading}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:opacity-60 sm:flex-none"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {studentProfile?.avatar ? 'Make it yours' : 'Add a profile photo'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {studentProfile?.avatar
                          ? 'Keep your profile picture up to date.'
                          : 'A profile picture helps personalize your account.'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={profileLoading || avatarUploading}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:opacity-60 sm:flex-none"
                      >
                        <Camera aria-hidden="true" className="h-4 w-4" />
                        {studentProfile?.avatar ? 'Change photo' : 'Upload photo'}
                      </button>
                      {studentProfile?.avatar && (
                        <button
                          type="button"
                          onClick={handleDeleteAvatar}
                          disabled={avatarUploading}
                          aria-label="Remove profile picture"
                          title="Remove profile picture"
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-400/20 text-rose-300 transition hover:bg-rose-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:opacity-60"
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-5">
                <h3 className="text-base font-semibold text-white">Profile details</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Your account information at a glance.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: 'Course',
                    value: studentProfile?.course,
                    icon: GraduationCap,
                  },
                  {
                    label: 'Date of birth',
                    value: studentProfile?.date_of_birth
                      ? new Date(studentProfile.date_of_birth).toLocaleDateString()
                      : null,
                    icon: CalendarDays,
                  },
                  { label: 'City', value: studentProfile?.city, icon: MapPin },
                  {
                    label: 'Contact',
                    value: studentProfile?.contact_number,
                    icon: Phone,
                  },
                  {
                    label: 'Joined',
                    value: studentProfile?.date_joined
                      ? new Date(studentProfile.date_joined).toLocaleDateString()
                      : null,
                    icon: Clock3,
                  },
                  {
                    label: 'Last updated',
                    value: studentProfile?.updated_at
                      ? new Date(studentProfile.updated_at).toLocaleDateString()
                      : null,
                    icon: Clock3,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/50 p-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-200">
                        {profileLoading ? 'Loading...' : value || 'Not provided'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-600/20 via-slate-800 to-slate-800 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="relative">
                <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20">
                  <GraduationCap aria-hidden="true" className="h-6 w-6" />
                </span>
                <p className="text-sm font-semibold text-indigo-200">Welcome back</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  Ready for your next assessment?
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Visit your assessments to see what is available and continue your learning.
                </p>
                <Link
                  to="/student/assessments"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 sm:w-auto"
                >
                  Go to assessments
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-700/80 bg-slate-800 p-6 shadow-xl shadow-slate-950/20 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-white">Your profile, your way</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Keep your account details current so your learning space feels like yours.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}