import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import API from '../service/Api';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import TeacherCreateAssessmentModal from '../components/TeacherCreateAssessment';

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Edit3,
  PlusCircle,
  Send,
  Trash2,
} from 'lucide-react';


const initialAssessmentForm = {
  title: '',
  topic: '',
  description: '',
  instructions: '',
  start_time: '',
  end_time: '',
  due_date: '',
  time_limit_minutes: 30,
  total_questions: 30,
  status: 'DRAFT',
};


/*
|--------------------------------------------------------------------------
| Convert Epoch -> datetime-local
|--------------------------------------------------------------------------
| Backend returns Unix epoch timestamps.
|
| Example:
| 1754563200
|        ↓
| 2025-08-07T12:00
|
| datetime-local inputs require:
| YYYY-MM-DDTHH:mm
|--------------------------------------------------------------------------
*/
const epochToDatetimeLocal = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '';
  }

  const date = new Date(numericValue * 1000);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};


/*
|--------------------------------------------------------------------------
| Convert datetime-local -> ISO
|--------------------------------------------------------------------------
| Used before sending data to Django.
|--------------------------------------------------------------------------
*/
const datetimeLocalToISO = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};


/*
|--------------------------------------------------------------------------
| Format epoch for display
|--------------------------------------------------------------------------
*/
const formatEpochDateTime = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not scheduled';
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 'Invalid date';
  }

  const date = new Date(numericValue * 1000);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString();
};


export default function TeacherAssessmentsPage() {
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);

  const [isAssessmentModalOpen, setIsAssessmentModalOpen] =
    useState(false);

  const [assessmentForm, setAssessmentForm] = useState(
    initialAssessmentForm
  );

  const [editingAssessmentId, setEditingAssessmentId] =
    useState(null);

  const [isAssessmentEditModalOpen, setIsAssessmentEditModalOpen] =
    useState(false);

  const [selectedAssessmentId, setSelectedAssessmentId] =
    useState(null);

  const [selectedStudentIds, setSelectedStudentIds] =
    useState([]);

  const [assigning, setAssigning] = useState(false);

  const [assigningAssessmentId, setAssigningAssessmentId] =
    useState(null);


  /*
  |--------------------------------------------------------------------------
  | Initial loading
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    fetchStudents();
    fetchAssessments();
  }, []);


  /*
  |--------------------------------------------------------------------------
  | Fetch students
  |--------------------------------------------------------------------------
  */
  const fetchStudents = async () => {
    try {
      const res = await API.get('/users/students/');

      setStudents(
        res.data.results || res.data
      );
    } catch (err) {
      console.error('Failed to fetch students:', err);

      toast.error('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Fetch assessments
  |--------------------------------------------------------------------------
  */
  const fetchAssessments = async () => {
    try {
      setAssessmentsLoading(true);

      const res = await API.get('/assessments/');

      setAssessments(
        res.data.results || res.data
      );
    } catch (err) {
      console.error(
        'Failed to fetch assessments:',
        err
      );

      toast.error('Failed to load assessments.');
    } finally {
      setAssessmentsLoading(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Reset assessment form
  |--------------------------------------------------------------------------
  */
  const resetAssessmentForm = () => {
    setEditingAssessmentId(null);

    setAssessmentForm({
      ...initialAssessmentForm,
    });
  };


  /*
  |--------------------------------------------------------------------------
  | Open Edit Assessment
  |--------------------------------------------------------------------------
  */
  const openEditAssessment = (assessment) => {
    setEditingAssessmentId(assessment.id);

    setAssessmentForm({
      title: assessment.title || '',

      topic: assessment.topic || '',

      description: assessment.description || '',

      instructions: assessment.instructions || '',

      /*
      IMPORTANT:
      Backend sends epoch timestamp.
      Convert it to datetime-local format.
      */
      start_time: epochToDatetimeLocal(
        assessment.start_time
      ),

      end_time: epochToDatetimeLocal(
        assessment.end_time
      ),

      due_date: epochToDatetimeLocal(
        assessment.due_date
      ),

      time_limit_minutes:
        assessment.time_limit_minutes || 30,

      total_questions:
        assessment.total_questions || 30,

      status:
        assessment.status || 'DRAFT',
    });

    setIsAssessmentEditModalOpen(true);
  };


  /*
  |--------------------------------------------------------------------------
  | Save / Update Assessment
  |--------------------------------------------------------------------------
  */
  const handleSaveAssessment = async (e) => {
    e.preventDefault();

    if (!editingAssessmentId) {
      toast.error('Assessment ID is missing.');
      return;
    }

    /*
    Validate start/end time
    */
    if (
      assessmentForm.start_time &&
      assessmentForm.end_time
    ) {
      const start = new Date(
        assessmentForm.start_time
      );

      const end = new Date(
        assessmentForm.end_time
      );

      if (start >= end) {
        toast.error(
          'End time must be after start time.'
        );

        return;
      }
    }

    try {
      /*
      Convert datetime-local values to ISO.
      Django EpochDateTimeField accepts ISO strings.
      */
      const payload = {
        title: assessmentForm.title,
        topic: assessmentForm.topic,
        description: assessmentForm.description,
        instructions: assessmentForm.instructions,

        start_time: datetimeLocalToISO(
          assessmentForm.start_time
        ),

        end_time: datetimeLocalToISO(
          assessmentForm.end_time
        ),

        due_date: datetimeLocalToISO(
          assessmentForm.due_date
        ),

        time_limit_minutes:
          Number(
            assessmentForm.time_limit_minutes
          ),

        total_questions:
          Number(
            assessmentForm.total_questions
          ),

        status: assessmentForm.status,
      };

      await API.patch(
        `/assessments/${editingAssessmentId}/`,
        payload
      );

      toast.success(
        'Assessment updated successfully.'
      );

      setIsAssessmentEditModalOpen(false);

      resetAssessmentForm();

      await fetchAssessments();

    } catch (err) {
      console.error(
        'Failed to update assessment:',
        err
      );

      const message =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to update assessment.';

      toast.error(message);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Assessment created
  |--------------------------------------------------------------------------
  */
  const handleAssessmentCreated = (
    newAssessment
  ) => {
    toast.success(
      'Assessment generated and published!'
    );

    if (newAssessment) {
      setAssessments((prev) => [
        newAssessment,
        ...prev,
      ]);
    }

    fetchAssessments();
  };


  /*
  |--------------------------------------------------------------------------
  | Delete assessment
  |--------------------------------------------------------------------------
  */
  const handleDeleteAssessment = async (
    assessmentId
  ) => {
    const confirmed = window.confirm(
      'Delete this assessment? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(
        `/assessments/${assessmentId}/`
      );

      toast.success(
        'Assessment deleted successfully.'
      );

      setAssessments((prev) =>
        prev.filter(
          (item) => item.id !== assessmentId
        )
      );

    } catch (err) {
      console.error(
        'Failed to delete assessment:',
        err
      );

      const message =
        err.response?.data?.detail ||
        'Failed to delete assessment.';

      toast.error(message);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Assign assessment
  |--------------------------------------------------------------------------
  */
  const handleAssignAssessment = async (
    assessmentId
  ) => {
    if (!assessmentId) {
      return;
    }

    setAssigning(true);

    setAssigningAssessmentId(
      assessmentId
    );

    try {
      const assignToAll =
        selectedStudentIds.length === 0;

      await API.post(
        `/assessments/${assessmentId}/assign/`,
        {
          student_ids: selectedStudentIds,

          assign_to_all_students:
            assignToAll,
        }
      );

      toast.success(
        'Assessment assigned successfully.'
      );

      setSelectedAssessmentId(null);

      setSelectedStudentIds([]);

      await fetchAssessments();

    } catch (err) {
      console.error(
        'Failed to assign assessment:',
        err
      );

      const message =
        err.response?.data?.detail ||
        'Failed to assign assessment.';

      toast.error(message);

    } finally {
      setAssigning(false);

      setAssigningAssessmentId(null);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Toggle student selection
  |--------------------------------------------------------------------------
  */
  const toggleStudentSelection = (
    studentId
  ) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter(
            (id) => id !== studentId
          )
        : [...prev, studentId]
    );
  };


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">

      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">

          <div>
            <h1 className="text-2xl font-bold text-white">
              Assessment Management
            </h1>

            <p className="text-slate-400 text-sm">
              Create, edit, and assign assessments from one place.
            </p>
          </div>


          <div className="flex flex-wrap items-center gap-3">

            <Link
              to="/teacher/dashboard"
              className="flex items-center bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-4 py-2.5 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />

              Back to Dashboard
            </Link>


            <button
              onClick={() =>
                setIsAssessmentModalOpen(true)
              }
              className="flex items-center bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-lg transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4 mr-2" />

              Create AI Assessment
            </button>

          </div>

        </div>


        {/* Information */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl mb-8">

          <div className="flex items-center gap-2 text-emerald-400 mb-2">

            <BookOpen className="w-5 h-5" />

            <h2 className="text-lg font-semibold text-white">
              Assessments
            </h2>

          </div>

          <p className="text-sm text-slate-400">
            Teachers can manage assessments here.
            Use the assignment flow to send them to
            one student, many students, or all students.
          </p>

        </div>


        {/* Loading */}
        {assessmentsLoading ? (

          <div className="p-8 bg-slate-800 border border-slate-700 rounded-xl text-center text-slate-400">
            Loading assessments...
          </div>

        ) : assessments.length === 0 ? (

          /* Empty */
          <div className="p-8 bg-slate-800 border border-slate-700 rounded-xl text-center">

            <p className="text-slate-300 font-medium mb-1">
              No assessments created yet.
            </p>

            <p className="text-xs text-slate-500 mb-4">
              Create your first assessment to start assigning it to students.
            </p>

            <button
              onClick={() =>
                setIsAssessmentModalOpen(true)
              }
              className="inline-flex items-center text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />

              Create Assessment
            </button>

          </div>

        ) : (

          /* Assessment List */
          <div className="space-y-4">

            {assessments.map((item) => (

              <div
                key={item.id || item.title}
                className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg"
              >

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                  {/* Assessment Information */}
                  <div>

                    <h3 className="font-bold text-white text-lg">
                      {item.title}
                    </h3>

                    <p className="text-sm text-slate-400 mt-1">
                      {item.topic || 'General Topic'}
                    </p>


                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">

                      <span className="inline-flex items-center gap-1">

                        <Clock className="w-3.5 h-3.5" />

                        {item.time_limit_minutes || 30} mins

                      </span>


                      {item.start_time && (

                        <span className="inline-flex items-center gap-1">

                          <Calendar className="w-3.5 h-3.5" />

                          {formatEpochDateTime(
                            item.start_time
                          )}

                        </span>

                      )}


                      <span className="inline-flex items-center gap-1">

                        Assigned:{' '}

                        {item.assigned_student_count || 0}

                      </span>

                    </div>

                  </div>


                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">

                    <button
                      onClick={() =>
                        openEditAssessment(item)
                      }
                      className="inline-flex items-center text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />

                      Edit
                    </button>


                    <button
                      onClick={() =>
                        setSelectedAssessmentId(
                          item.id
                        )
                      }
                      className="inline-flex items-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />

                      Assign
                    </button>


                    <button
                      onClick={() =>
                        handleDeleteAssessment(
                          item.id
                        )
                      }
                      className="inline-flex items-center text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />

                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>


      {/* ======================================================
          EDIT ASSESSMENT MODAL
          ====================================================== */}

      <Modal
        isOpen={isAssessmentEditModalOpen}
        onClose={() => {
          setIsAssessmentEditModalOpen(false);

          resetAssessmentForm();
        }}
        title="Edit Assessment"
      >

        <form
          onSubmit={handleSaveAssessment}
          className="space-y-4"
        >

          {/* Title */}
          <div>

            <label className="block text-xs text-slate-400 mb-1">
              Title
            </label>

            <input
              type="text"
              required
              value={assessmentForm.title}
              onChange={(e) =>
                setAssessmentForm({
                  ...assessmentForm,
                  title: e.target.value,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />

          </div>


          {/* Topic */}
          <div>

            <label className="block text-xs text-slate-400 mb-1">
              Topic
            </label>

            <input
              type="text"
              required
              value={assessmentForm.topic}
              onChange={(e) =>
                setAssessmentForm({
                  ...assessmentForm,
                  topic: e.target.value,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />

          </div>


          {/* Description */}
          <div>

            <label className="block text-xs text-slate-400 mb-1">
              Description
            </label>

            <textarea
              rows="3"
              value={assessmentForm.description}
              onChange={(e) =>
                setAssessmentForm({
                  ...assessmentForm,
                  description: e.target.value,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />

          </div>


          {/* Instructions */}
          <div>

            <label className="block text-xs text-slate-400 mb-1">
              Instructions
            </label>

            <textarea
              rows="3"
              value={assessmentForm.instructions}
              onChange={(e) =>
                setAssessmentForm({
                  ...assessmentForm,
                  instructions: e.target.value,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />

          </div>


          {/* Start / End */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Start */}
            <div>

              <label className="block text-xs text-slate-400 mb-1">
                Start Time
              </label>

              <input
                type="datetime-local"
                value={assessmentForm.start_time}
                onChange={(e) =>
                  setAssessmentForm({
                    ...assessmentForm,
                    start_time: e.target.value,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />

            </div>


            {/* End */}
            <div>

              <label className="block text-xs text-slate-400 mb-1">
                End Time
              </label>

              <input
                type="datetime-local"
                value={assessmentForm.end_time}
                onChange={(e) =>
                  setAssessmentForm({
                    ...assessmentForm,
                    end_time: e.target.value,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />

            </div>

          </div>


          {/* Due Date / Time Limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Due Date */}
            <div>

              <label className="block text-xs text-slate-400 mb-1">
                Due Date
              </label>

              <input
                type="datetime-local"
                value={assessmentForm.due_date}
                onChange={(e) =>
                  setAssessmentForm({
                    ...assessmentForm,
                    due_date: e.target.value,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />

            </div>


            {/* Time Limit */}
            <div>

              <label className="block text-xs text-slate-400 mb-1">
                Time Limit (mins)
              </label>

              <input
                type="number"
                min="1"
                value={
                  assessmentForm.time_limit_minutes
                }
                onChange={(e) =>
                  setAssessmentForm({
                    ...assessmentForm,
                    time_limit_minutes:
                      Number(e.target.value),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />

            </div>

          </div>


          {/* Status */}
          <div>

            <label className="block text-xs text-slate-400 mb-1">
              Status
            </label>

            <select
              value={assessmentForm.status}
              onChange={(e) =>
                setAssessmentForm({
                  ...assessmentForm,
                  status: e.target.value,
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >

              <option value="DRAFT">
                Draft
              </option>

              <option value="PUBLISHED">
                Published
              </option>

              <option value="ASSIGNED">
                Assigned
              </option>

              <option value="COMPLETED">
                Completed
              </option>

            </select>

          </div>


          {/* Save */}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg mt-4"
          >
            Save Changes
          </button>

        </form>

      </Modal>


      {/* ======================================================
          ASSIGN ASSESSMENT MODAL
          ====================================================== */}

      {selectedAssessmentId && (

        <Modal
          isOpen={Boolean(selectedAssessmentId)}
          onClose={() => {
            setSelectedAssessmentId(null);

            setSelectedStudentIds([]);
          }}
          title="Assign Assessment"
        >

          <div className="space-y-4">

            <p className="text-sm text-slate-400">
              Choose students for this assessment or
              assign it to all students.
            </p>


            {/* Assign all */}
            <label className="flex items-center gap-2 text-sm text-slate-300">

              <input
                type="checkbox"
                checked={
                  selectedStudentIds.length === 0
                }
                onChange={() => {
                  setSelectedStudentIds([]);
                }}
                className="rounded border-slate-600 bg-slate-900"
              />

              Assign to all students

            </label>


            {/* Students */}
            <div className="max-h-60 overflow-auto rounded-lg border border-slate-700 divide-y divide-slate-700">

              {loading ? (

                <p className="p-4 text-sm text-slate-400">
                  Loading students...
                </p>

              ) : students.length === 0 ? (

                <p className="p-4 text-sm text-slate-400">
                  No students found.
                </p>

              ) : (

                students.map((student) => (

                  <label
                    key={student.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900/60"
                  >

                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(
                        student.id
                      )}
                      onChange={() =>
                        toggleStudentSelection(
                          student.id
                        )
                      }
                      className="rounded border-slate-600 bg-slate-900"
                    />

                    <span>
                      {student.first_name}{' '}
                      {student.last_name}{' '}
                      ({student.email})
                    </span>

                  </label>

                ))

              )}

            </div>


            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">

              <button
                type="button"
                onClick={() => {
                  setSelectedAssessmentId(null);

                  setSelectedStudentIds([]);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm"
              >
                Cancel
              </button>


              <button
                type="button"
                disabled={assigning}
                onClick={() =>
                  handleAssignAssessment(
                    selectedAssessmentId
                  )
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm disabled:opacity-50"
              >

                {assigning &&
                assigningAssessmentId ===
                  selectedAssessmentId
                  ? 'Assigning...'
                  : 'Assign'}

              </button>

            </div>

          </div>

        </Modal>

      )}


      {/* ======================================================
          CREATE AI ASSESSMENT MODAL
          ====================================================== */}

      <TeacherCreateAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() =>
          setIsAssessmentModalOpen(false)
        }
        onCreated={handleAssessmentCreated}
      />

    </div>
  );
}