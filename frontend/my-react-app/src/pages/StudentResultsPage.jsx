import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../service/Api';
import { Trophy, Home } from 'lucide-react';

export default function StudentResultsPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError('');

      const res = await API.get(`/assessments/results/${attemptId}/`);
        setResult(res.data);
      } catch (err) {
        console.error('Failed to fetch assessment result:', err);

        setError(
          err.response?.data?.detail ||
            'Unable to load assessment result.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchResults();
    }
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Computing assessment score...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
          <h1 className="text-xl font-bold text-white mb-3">
            Unable to Load Result
          </h1>

          <p className="text-sm text-slate-400 mb-6">
            {error}
          </p>

          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-all"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const score = Number(result?.score) || 0;
  const totalMarks = Number(result?.total_marks) || 0;
  const correctAnswers = Number(result?.correct_answers) || 0;
  const totalQuestions = Number(result?.total_questions) || 0;

  const percentage =
    Number.isFinite(Number(result?.percentage))
      ? Number(result.percentage)
      : totalMarks > 0
        ? (score / totalMarks) * 100
        : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl text-center">

        {/* Trophy */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit mx-auto mb-4">
          <Trophy className="w-12 h-12 text-amber-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-1">
          Exam Finished
        </h1>

        <p className="text-sm text-slate-400 mb-6">
          {result?.assessment || 'Assessment'}
        </p>

        {/* Score */}
        <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-700 mb-6">

          <div className="text-4xl font-extrabold text-indigo-400 mb-1">
            {score} / {totalMarks}
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Final Score ({percentage.toFixed(1)}%)
          </div>

        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 mb-6">

          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-400">
              {correctAnswers}
            </div>

            <div className="text-xs text-slate-400 mt-1">
              Correct Answers
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">
              {totalQuestions}
            </div>

            <div className="text-xs text-slate-400 mt-1">
              Total Questions
            </div>
          </div>

        </div>

        {/* Status */}
        <div className="text-sm text-slate-400 mb-6">
          Status:{' '}
          <span className="text-slate-200 font-medium">
            {result?.status || 'SUBMITTED'}
          </span>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/student/dashboard')}
          className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-all"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>

      </div>
    </div>
  );
}