import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API from '../service/Api';
import Navbar from '../components/Navbar';

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
      await API.patch('/users/profile/me/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await fetchStudentProfile();
      setSelectedAvatarFile(null);
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
        setPreviewAvatarUrl(null);
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err.response?.data || err);
      toast.error('Unable to update profile picture.');
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

  const handleViewProfile = () => {
    if (!studentProfile) return;
    toast.info(
      `Profile:\nName: ${studentProfile.first_name || ''} ${studentProfile.last_name || ''}\nEmail: ${studentProfile.email || ''}\nStudent ID: ${studentProfile.student_id || '-'}\nDOB: ${studentProfile.date_of_birth || '-'}\nCourse: ${studentProfile.course || '-'}\nCity: ${studentProfile.city || '-'}\nContact: ${studentProfile.contact_number || '-'}`
    );
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
          <p className="text-slate-400 text-sm">Select an available assessment to begin</p>
        </div>

        <div className="grid gap-6 mb-8 lg:grid-cols-[320px_1fr]">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group w-20 h-20 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                {profileLoading ? (
                  <div className="w-full h-full bg-slate-700 animate-pulse" />
                ) : selectedAvatarFile && previewAvatarUrl ? (
                  <img
                    src={previewAvatarUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : studentProfile?.avatar ? (
                  <img
                    src={getAvatarUrl(studentProfile.avatar)}
                    alt="Student avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-700 text-slate-400 text-sm">
                    No Image
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-slate-900/0 transition-all duration-200 group-hover:bg-slate-900/70 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-200 mb-2">Profile actions</div>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={handleViewProfile}
                      className="pointer-events-auto inline-flex items-center justify-center px-3 py-1.5 bg-slate-700/95 text-white rounded-full text-xs font-semibold"
                    >
                      View profile
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="pointer-events-auto inline-flex items-center justify-center px-3 py-1.5 bg-indigo-600/90 text-white rounded-full text-xs font-semibold"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      className="pointer-events-auto inline-flex items-center justify-center px-3 py-1.5 bg-rose-600/90 text-white rounded-full text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{studentProfile?.first_name || 'Student'} {studentProfile?.last_name || ''}</h2>
                <p className="text-slate-400">{studentProfile?.email || ''}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs uppercase tracking-wide text-indigo-300">
                  <span>{studentProfile?.role || 'STUDENT'}</span>
                  <span className="bg-slate-700/80 px-2 py-0.5 rounded-full">ID: {studentProfile?.student_id || '-'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Course</div>
                <div className="text-sm text-slate-300">
                  {studentProfile?.course || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Date of Birth</div>
                <div className="text-sm text-slate-300">
                  {studentProfile?.date_of_birth ? new Date(studentProfile.date_of_birth).toLocaleDateString() : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">City</div>
                <div className="text-sm text-slate-300">
                  {studentProfile?.city || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Contact</div>
                <div className="text-sm text-slate-300">
                  {studentProfile?.contact_number || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Joined</div>
                <div className="text-sm text-slate-300">
                  {studentProfile?.date_joined ? new Date(studentProfile.date_joined).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Last updated</div>
                <div className="text-sm text-slate-300">
                  {studentProfile?.updated_at ? new Date(studentProfile.updated_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-xs text-slate-400 mb-2">Profile picture controls</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
              {selectedAvatarFile && (
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                  <div className="text-sm text-slate-300 mb-3">Preview selected image before upload.</div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleConfirmAvatar}
                      disabled={avatarUploading}
                      className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {avatarUploading ? 'Uploading...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAvatar}
                      className="inline-flex items-center justify-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-white mb-3">Welcome back</h2>
            <p className="text-slate-400 text-sm leading-6">
              Your assessments are now shown on the dedicated assessments page so this dashboard stays focused on your profile.
            </p>
            <Link
              to="/student/assessments"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Go to Assessments
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}