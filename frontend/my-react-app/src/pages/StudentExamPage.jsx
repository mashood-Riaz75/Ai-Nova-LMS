import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../service/Api';
import Navbar from '../components/Navbar';
import { Lock, CheckCircle2, ChevronRight } from 'lucide-react';

export default function StudentExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [taskDetails, setTaskDetails] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isQuitting, setIsQuitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);

  useEffect(() => {
    startAndLoadExam();
  }, [examId]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExam();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const startAndLoadExam = async () => {
    try {
      setLoading(true);

      // 1. Start the assessment first
      const startResponse = await API.post(
        `/assessments/${examId}/start/`
      );

      const newAttemptId = startResponse.data.attempt_id;
      setAttemptId(newAttemptId);

      // 2. Now load questions
      const response = await API.get(
        `/assessments/${examId}/questions/`
      );

      setQuestions(response.data.questions || []);
      setTaskDetails(response.data.task || {});
      setTimeLeft(response.data.remaining_seconds || 0);

    } catch (err) {
      console.error(
        'Failed to start assessment:',
        err.response?.data || err
      );

      toast.error(
        err.response?.data?.detail ||
        'Unable to start assessment.'
      );

      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLockAndNext = async () => {
    if (!selectedOption) return;

    const currentState = questions[currentIndex];

    try {
      await API.post(
        `/assessments/${examId}/submit-answer/`,
        {
          state_id: currentState.id,
          option_id: selectedOption,
        }
      );

      setSelectedOption(null);

      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        finishExam();
      }

    } catch (err) {
      console.error(
        'Failed to submit answer:',
        err.response?.data || err
      );

      toast.error(
        err.response?.data?.detail ||
        'Failed to submit answer.'
      );
    }
  };

  const finishExam = () => {
    if (attemptId) {
      navigate(`/student/results/${attemptId}`);
    }
  };

  const handleQuitAssessment = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to quit this assessment?'
    );

    if (!confirmed) return;

    setIsQuitting(true);

    try {
      await API.post(
        `/assessments/${examId}/quit/`
      );

      toast.success('Assessment quit successfully.');
      navigate('/student/dashboard');

    } catch (err) {
      console.error(
        'Failed to quit assessment:',
        err.response?.data || err
      );

      toast.error(
        err.response?.data?.detail ||
        'Unable to quit assessment.'
      );
    } finally {
      setIsQuitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Preparing examination...
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">
            No questions available for this assessment.
          </p>

          <button
            onClick={() => navigate('/student/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion =
    currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">
              {taskDetails?.title || 'Assessment'}
            </h1>

            <p className="text-sm text-slate-400">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">
              Time Remaining
            </p>

            <p className="text-xl font-mono font-bold text-emerald-400">
              {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-xl">

          <div className="mb-6">

            <span className="inline-block bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-2.5 py-1 rounded-full mb-3">
              Strict Mode: Answers lock upon submission
            </span>

            <h2 className="text-lg font-medium text-slate-100">
              {currentQ?.question?.prompt ||
                'No question text provided'}
            </h2>
          </div>

          <div className="space-y-3 mb-8">

            {(currentQ?.question?.options || []).map((opt) => (
              <button
                key={opt.id}
                onClick={() =>
                  setSelectedOption(opt.id)
                }
                className={`w-full text-left p-4 rounded-lg border transition-all flex justify-between items-center ${
                  selectedOption === opt.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>{opt.text}</span>

                {selectedOption === opt.id && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                )}
              </button>
            ))}

          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-700">

            <div className="flex items-center text-slate-500 text-xs">
              <Lock className="w-3.5 h-3.5 mr-1" />
              Previous questions are locked
            </div>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={handleQuitAssessment}
                disabled={isQuitting}
                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-slate-200 px-4 py-2 rounded-lg text-sm"
              >
                {isQuitting
                  ? 'Quitting...'
                  : 'Quit Assessment'}
              </button>

              <button
                onClick={handleLockAndNext}
                disabled={!selectedOption}
                className="flex items-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 py-2 rounded-lg text-sm"
              >
                {isLastQuestion
                  ? 'Submit & Finalize'
                  : 'Next & Lock Answer'}

                <ChevronRight className="w-4 h-4 ml-1" />
              </button>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}