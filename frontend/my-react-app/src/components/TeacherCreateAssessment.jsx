import React, { useState } from 'react';
import API from '../service/Api';

export default function TeacherCreateAssessmentModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    start_time: '',
    end_time: '',
    time_limit_minutes: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate times
    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      setError('End time must be after start time.');
      setLoading(false);
      return;
    }

    try {
      // Convert HTML datetime-local strings to standard ISO format for Django DRF
      const payload = {
        ...formData,
        time_limit_minutes: Number(formData.time_limit_minutes),
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      const response = await API.post('/assessments/create-with-ai/', payload);
      const data = response?.data || {};

      onCreated(data);
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        err.message ||
        'Failed to generate assessment';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Create Assessment (AI-Powered)</h2>
        <p className="text-sm text-slate-500 mb-6">Grok AI will generate 30 balanced questions automatically.</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Assessment Title</label>
            <input
              type="text"
              required
              disabled={loading}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 disabled:bg-slate-100"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Midterm Physics Exam"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Topic / Syllabus Scope</label>
            <input
              type="text"
              required
              disabled={loading}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 disabled:bg-slate-100"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g., Quantum Mechanics & Wave Optics"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Start Time</label>
              <input
                type="datetime-local"
                required
                disabled={loading}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 text-sm disabled:bg-slate-100"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">End Time</label>
              <input
                type="datetime-local"
                required
                disabled={loading}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 text-sm disabled:bg-slate-100"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Duration (Minutes)</label>
            <input
              type="number"
              min="5"
              max="180"
              required
              disabled={loading}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 disabled:bg-slate-100"
              value={formData.time_limit_minutes}
              onChange={(e) => setFormData({ ...formData, time_limit_minutes: parseInt(e.target.value, 10) || '' })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg shadow-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Generating Questions...
                </>
              ) : (
                'Create & Generate MCQs'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}