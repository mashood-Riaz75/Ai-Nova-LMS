import React, { useState, useEffect, useCallback } from 'react';

export default function StudentQuizPlayer({ assessmentId }) {
  const [gameState, setGameState] = useState('LOADING'); // LOCKED, READY, IN_PROGRESS, COMPLETED
  const [currentState, setCurrentState] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [selectedOption, setSelectedOption] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [finalScore, setFinalScore] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  // Timer Tick
  useEffect(() => {
    if (gameState !== 'IN_PROGRESS' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchCurrentQuestion(); // Triggers auto-expire on server
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const fetchCurrentQuestion = useCallback(async () => {
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/current-question/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.status === 403) {
        setGameState('COMPLETED');
        setFinalScore(data.score ?? 0);
        return;
      }

      if (data.status === 'SUBMITTED' || data.status === 'EXPIRED') {
        setGameState('COMPLETED');
        setFinalScore(data.score);
        return;
      }

      setCurrentState(data.state);
      setTotalQuestions(data.total_questions);
      setTimeLeft(data.remaining_seconds);
      setSelectedOption('');
      setGameState('IN_PROGRESS');
    } catch (err) {
      setErrorMsg('Failed to load active question.');
    }
  }, [assessmentId, token]);

  const startQuiz = async () => {
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/start/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setGameState('LOCKED');
          setErrorMsg(data.detail);
        } else {
          setErrorMsg(data.detail || 'Could not start assessment.');
        }
        return;
      }

      fetchCurrentQuestion();
    } catch (err) {
      setErrorMsg('Network error starting assessment.');
    }
  };

  const handleAnswerSubmit = async () => {
    if (!selectedOption || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/assessments/${assessmentId}/submit-answer/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          state_id: currentState.id,
          option_id: selectedOption
        })
      });

      const data = await res.json();

      if (data.completed) {
        setGameState('COMPLETED');
        setFinalScore(data.score);
      } else {
        fetchCurrentQuestion();
      }
    } catch (err) {
      setErrorMsg('Failed to lock answer. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Locked State
  if (gameState === 'LOCKED') {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <div className="text-3xl mb-2">🔒</div>
        <h3 className="text-lg font-bold text-amber-900">Assessment Locked</h3>
        <p className="text-sm text-amber-700 mt-1">{errorMsg || 'This assessment is not available at this time.'}</p>
      </div>
    );
  }

  // Pre-Start State
  if (gameState === 'LOADING') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white shadow-lg rounded-xl border text-center">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Ready to Begin?</h3>
        <p className="text-sm text-slate-500 mb-6">
          Once started, questions must be answered sequentially. You <strong>cannot return</strong> to previous questions.
        </p>
        <button
          onClick={startQuiz}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition"
        >
          Start Assessment
        </button>
      </div>
    );
  }

  // Completed / Expired State
  if (gameState === 'COMPLETED') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white shadow-xl rounded-xl border border-slate-100 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">✓</div>
        <h2 className="text-2xl font-bold text-slate-800">Assessment Completed</h2>
        <p className="text-sm text-slate-500 mt-1">Your responses have been recorded and graded.</p>
        
        <div className="my-6 p-4 bg-slate-50 rounded-lg border">
          <span className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Final Score</span>
          <div className="text-4xl font-extrabold text-slate-800 mt-1">{finalScore} Marks</div>
        </div>
      </div>
    );
  }

  // Active Test Engine UI
  const { question } = currentState;

  return (
    <div className="max-w-2xl mx-auto my-8 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
      {/* Top Bar Navigation */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 uppercase font-semibold">Question</span>
          <div className="text-lg font-bold">{currentState.order_index} <span className="text-slate-500 text-sm">/ {totalQuestions}</span></div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 uppercase font-semibold">Time Remaining</span>
          <div className={`text-lg font-mono font-bold ${timeLeft < 180 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Question Prompt */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            question.difficulty === 'HIGH' ? 'bg-red-100 text-red-700' :
            question.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
          }`}>
            {question.difficulty} DIFFICULTY
          </span>
          <span className="text-xs text-slate-400 font-medium">{question.marks} Mark(s)</span>
        </div>

        <h3 className="text-lg font-medium text-slate-800 mb-6 leading-relaxed">
          {question.prompt}
        </h3>

        {/* Option Selection */}
        <div className="space-y-3">
          {question.options.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${
                selectedOption === opt.id
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="option"
                value={opt.id}
                checked={selectedOption === opt.id}
                onChange={() => setSelectedOption(opt.id)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-3 font-medium text-sm">{opt.text}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Bottom Bar Locking Submit */}
      <div className="bg-slate-50 px-6 py-4 border-t flex items-center justify-between">
        <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
          ⚠️ Action is irreversible. Answers lock upon submission.
        </p>
        <button
          onClick={handleAnswerSubmit}
          disabled={!selectedOption || submitting}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          {submitting ? 'Locking...' : currentState.order_index === totalQuestions ? 'Submit Exam' : 'Submit & Next →'}
        </button>
      </div>
    </div>
  );
}