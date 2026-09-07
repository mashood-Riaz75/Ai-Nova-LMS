import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../service/Api';
import Navbar from '../components/Navbar';

import {
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
} from 'lucide-react';


const formatDateTime = (value) => {

  if (!value) {
    return 'Not scheduled';
  }

  let timestamp = null;

  if (typeof value === 'number') {

    timestamp =
      value < 1e12
        ? value * 1000
        : value;

  } else if (
    typeof value === 'string'
    && /^\d+$/.test(value.trim())
  ) {

    const numericValue =
      Number(value.trim());

    timestamp =
      numericValue < 1e12
        ? numericValue * 1000
        : numericValue;

  } else {

    const parsed =
      Date.parse(value);

    if (!Number.isNaN(parsed)) {
      timestamp = parsed;
    }
  }

  if (!timestamp) {
    return 'Not scheduled';
  }

  return new Date(timestamp).toLocaleString(
    'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );
};


export default function StudentAssessmentsPage() {

  const [
    studentTasks,
    setStudentTasks
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    removingId,
    setRemovingId
  ] = useState(null);

  const navigate =
    useNavigate();


  // ========================================================
  // FETCH ASSESSMENTS
  // ========================================================

  useEffect(() => {

    let isMounted = true;

    const fetchStudentTasks =
      async () => {

        try {

          const res =
            await API.get(
              '/assessments/student-tasks/'
            );

          if (!isMounted) {
            return;
          }

          setStudentTasks(
            res.data.results
            || res.data
            || []
          );

        } catch (err) {

          console.error(
            'Failed to load assessments:',
            err.response?.data || err
          );

          if (isMounted) {

            toast.error(
              'Unable to load your assessments right now.'
            );
          }

        } finally {

          if (isMounted) {
            setLoading(false);
          }
        }
      };


    fetchStudentTasks();

    const intervalId =
      window.setInterval(
        fetchStudentTasks,
        15000
      );


    return () => {

      isMounted = false;

      window.clearInterval(
        intervalId
      );
    };

  }, []);


  // ========================================================
  // REMOVE COMPLETED ASSESSMENT
  // ========================================================

  const handleRemoveAssessment =
    async (assessmentId) => {

      const confirmed =
        window.confirm(
          'Are you sure you want to remove this completed assessment?'
        );

      if (!confirmed) {
        return;
      }

      try {

        setRemovingId(
          assessmentId
        );

        await API.delete(
          `/assessments/${assessmentId}/remove/`
        );

        setStudentTasks(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !== assessmentId
            )
        );

        toast.success(
          'Assessment removed from your dashboard.'
        );

      } catch (err) {

        console.error(
          'Failed to remove assessment:',
          err.response?.data || err
        );

        toast.error(
          err.response?.data?.detail
          || 'Unable to remove assessment.'
        );

      } finally {

        setRemovingId(null);
      }
    };


  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {

    return (
      <div className="min-h-screen bg-slate-900">

        <Navbar />

        <main className="max-w-7xl mx-auto px-6 py-8">

          <div className="text-center p-8 text-slate-400 bg-slate-800 rounded-xl border border-slate-700">

            Loading assessments...

          </div>

        </main>

      </div>
    );
  }


  // ========================================================
  // EMPTY STATE
  // ========================================================

  if (studentTasks.length === 0) {

    return (
      <div className="min-h-screen bg-slate-900">

        <Navbar />

        <main className="max-w-7xl mx-auto px-6 py-8">

          <div className="mb-8">

            <h1 className="text-2xl font-bold text-white">
              My Assessments
            </h1>

            <p className="text-slate-400 text-sm">
              View and continue your assigned assessments from one place.
            </p>

          </div>

          <div className="text-center p-8 text-slate-400 bg-slate-800 rounded-xl border border-slate-700">

            No assessments available.

          </div>

        </main>

      </div>
    );
  }


  // ========================================================
  // MAIN UI
  // ========================================================

  return (

    <div className="min-h-screen bg-slate-900">

      <Navbar />


      <main className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-8">

          <h1 className="text-2xl font-bold text-white">
            My Assessments
          </h1>

          <p className="text-slate-400 text-sm">
            View and continue your assigned assessments from one place.
          </p>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {studentTasks.map((item) => {

            const task =
              item.task || {};

            const isCompleted =
              item.is_completed;

            const canStart =
              item.can_start;

            const isScheduled =
              item.is_scheduled;

            const isRemoving =
              removingId === item.id;


            return (

              <div
                key={item.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col justify-between shadow-xl"
              >

                <div>

                  {/* Header */}

                  <div className="flex justify-between items-start mb-2">

                    <h3 className="text-lg font-bold text-white">

                      {task.title
                        || 'Untitled Assessment'}

                    </h3>


                    {isCompleted && (

                      <span className="flex items-center text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">

                        <CheckCircle2 className="w-3 h-3 mr-1" />

                        Completed

                      </span>

                    )}

                  </div>


                  {/* Description */}

                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">

                    {task.description
                      || 'No description provided.'}

                  </p>


                  {/* Duration */}

                  <div className="flex items-center text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full w-fit mb-2">

                    <Clock className="w-3.5 h-3.5 mr-1.5" />

                    {task.time_limit_minutes
                      || task.duration_minutes
                      || 0}

                    {' '}Minutes

                  </div>


                  {/* Scheduled */}

                  {task.start_time && (

                    <div
                      className={`flex items-center text-xs px-3 py-1 rounded-full w-fit mb-4 ${
                        isScheduled
                          ? 'text-sky-400 bg-sky-500/10 border border-sky-500/20'
                          : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      }`}
                    >

                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" />

                      {isScheduled
                        ? `Starts ${formatDateTime(
                            task.start_time
                          )}`
                        : isCompleted
                          ? 'Assessment completed'
                          : 'Available now'}

                    </div>

                  )}


                  {/* Score */}

                  {isCompleted && (

                    <div className="mt-4 p-3 bg-slate-900 border border-slate-700 rounded-lg">

                      <p className="text-xs text-slate-400">
                        Assessment completed
                      </p>

                      <p className="text-sm text-emerald-400 font-semibold mt-1">
                        View your result to see your score.
                      </p>

                    </div>

                  )}

                </div>


                {/* Buttons */}

                <div className="mt-6 space-y-2">

                  {isCompleted ? (

                    <>

                      {/* View Result */}

                      <button
                        onClick={() =>
                          navigate(
                            `/student/results/${item.attempt_id}`
                          )
                        }
                        disabled={!item.attempt_id}
                        className="w-full flex items-center justify-center font-medium py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-all"
                      >

                        <Eye className="w-4 h-4 mr-2" />

                        View Result

                      </button>


                      {/* Remove */}

                      <button
                        onClick={() =>
                          handleRemoveAssessment(
                            item.id
                          )
                        }
                        disabled={isRemoving}
                        className="w-full flex items-center justify-center font-medium py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 disabled:opacity-50 transition-all"
                      >

                        <Trash2 className="w-4 h-4 mr-2" />

                        {isRemoving
                          ? 'Removing...'
                          : 'Remove Assessment'}

                      </button>

                    </>

                  ) : (

                    <button
                      onClick={() =>
                        navigate(
                          `/student/exam/${item.id}`
                        )
                      }
                      disabled={!canStart}
                      className={`w-full flex items-center justify-center font-medium py-2.5 rounded-lg transition-all ${
                        canStart
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >

                      <Play className="w-4 h-4 mr-2 fill-current" />

                      {isScheduled
                        ? 'Starts Later'
                        : canStart
                          ? 'Start Assessment'
                          : 'Unavailable'}

                    </button>

                  )}

                </div>

              </div>
            );
          })}

        </div>

      </main>

    </div>
  );
}