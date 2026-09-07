import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API from '../service/Api';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { UserPlus, BookOpen, Users, Edit3, Trash2, AlertTriangle } from 'lucide-react';

const initialStudentForm = {
  email: '',
  first_name: '',
  last_name: '',
  date_of_birth: '',
  department: '',
  city: '',
  course: '',
  contact_number: '',
};

export default function TeacherDashboardPage() {
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);

  // Deletion Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const departments = [
    { value: '', label: 'Select department' },
    { value: 'SCIENCE', label: 'Science' },
    { value: 'ARTS', label: 'Arts' },
    { value: 'COMMERCE', label: 'Commerce' },
    { value: 'ENGINEERING', label: 'Engineering' },
    { value: 'MEDICAL', label: 'Medical' },
  ];

  const cities = [
    { value: '', label: 'Select city' },
    { value: 'NEW_YORK', label: 'New York' },
    { value: 'LOS_ANGELES', label: 'Los Angeles' },
    { value: 'CHICAGO', label: 'Chicago' },
    { value: 'HOUSTON', label: 'Houston' },
    { value: 'MIAMI', label: 'Miami' },
  ];

  const courses = [
    { value: '', label: 'Select course' },
    { value: 'MATHEMATICS', label: 'Mathematics' },
    { value: 'ENGLISH', label: 'English' },
    { value: 'PHYSICS', label: 'Physics' },
    { value: 'CHEMISTRY', label: 'Chemistry' },
    { value: 'COMPUTER_SCIENCE', label: 'Computer Science' },
  ];

  useEffect(() => {
    fetchStudents();
    fetchAssessments();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await API.get('/users/students/');
      setStudents(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    try {
      setAssessmentsLoading(true);
      const res = await API.get('/assessments/');
      setAssessments(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
    } finally {
      setAssessmentsLoading(false);
    }
  };

  const resetStudentForm = () => {
    setEditingStudentId(null);
    setStudentForm(initialStudentForm);
  };

  const validateStudentForm = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!studentForm.email.trim() || !studentForm.first_name.trim() || !studentForm.last_name.trim()) {
      toast.error('Please fill in the email, first name, and last name.');
      return false;
    }

    if (!emailPattern.test(studentForm.email)) {
      toast.error('Please enter a valid student email address.');
      return false;
    }

    if (!studentForm.department || !studentForm.city || !studentForm.course) {
      toast.error('Please select a department, city, and course.');
      return false;
    }

    if (!studentForm.contact_number.trim()) {
      toast.error('Please enter the student contact number.');
      return false;
    }

    return true;
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();

    if (!validateStudentForm()) {
      return;
    }

    try {
      const payload = { ...studentForm, role: 'STUDENT' };
      if (editingStudentId) {
        await API.patch(`/users/students/${editingStudentId}/`, payload);
        toast.success('Student updated successfully.');
      } else {
        await API.post('/users/students/', payload);
        toast.success('Student created successfully.');
      }
      setIsStudentModalOpen(false);
      resetStudentForm();
      fetchStudents();
    } catch (err) {
      const message = err.response?.data?.detail || `Failed to ${editingStudentId ? 'update' : 'create'} student.`;
      toast.error(message);
    }
  };

  const openDeleteConfirmation = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;

    setDeleting(true);
    try {
      await API.delete(`/users/students/${studentToDelete.id}/`);
      toast.success('Student deleted successfully.');
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to delete student.';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const openEditStudent = (student) => {
    setEditingStudentId(student.id);
    setStudentForm({
      email: student.email || '',
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      date_of_birth: student.student_profile?.date_of_birth || '',
      department: student.student_profile?.department || '',
      city: student.student_profile?.city || '',
      course: student.student_profile?.course || '',
      contact_number: student.student_profile?.contact_number || '',
    });
    setIsStudentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Teacher Dashboard</h1>
            <p className="text-slate-400 text-sm">Manage students and monitor academic assessments</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                resetStudentForm();
                setIsStudentModalOpen(true);
              }}
              className="flex items-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-lg transition-all shadow-md"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Register New Student
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{students.length}</div>
              <div className="text-sm text-slate-400">Total Enrolled Students</div>
            </div>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{assessments.length}</div>
              <div className="text-sm text-slate-400">Total Assessments Created</div>
            </div>
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-700 font-semibold text-white">Student Roster</div>
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading student roster...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/50 uppercase text-xs text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3">Student ID</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Course</th>
                    <th className="px-6 py-3">City</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-slate-300">{st.student_profile?.student_id || '-'}</td>
                      <td className="px-6 py-4 font-medium text-white">{st.first_name} {st.last_name}</td>
                      <td className="px-6 py-4 text-slate-400">{st.email}</td>
                      <td className="px-6 py-4 text-slate-400">{st.student_profile?.department || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{st.student_profile?.course || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{st.student_profile?.city || '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{st.student_profile?.contact_number || '-'}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => openEditStudent(st)}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                          title="Edit Student"
                        >
                          <Edit3 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirmation(st)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal to Register / Edit Student */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          resetStudentForm();
        }}
        title={editingStudentId ? 'Edit Student' : 'Register New Student'}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">First Name</label>
            <input
              type="text"
              required
              value={studentForm.first_name}
              onChange={(e) => setStudentForm({ ...studentForm, first_name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Last Name</label>
            <input
              type="text"
              required
              value={studentForm.last_name}
              onChange={(e) => setStudentForm({ ...studentForm, last_name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={studentForm.email}
              onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Password</label>
            <div className="text-sm text-slate-400">A random password will be generated and emailed to the student.</div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Date of Birth</label>
            <input
              type="date"
              value={studentForm.date_of_birth}
              onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Department</label>
            <select
              required
              value={studentForm.department}
              onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              {departments.map((item) => (
                <option key={item.value} value={item.value} disabled={!item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">City</label>
            <select
              required
              value={studentForm.city}
              onChange={(e) => setStudentForm({ ...studentForm, city: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              {cities.map((item) => (
                <option key={item.value} value={item.value} disabled={!item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Course</label>
            <select
              required
              value={studentForm.course}
              onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              {courses.map((item) => (
                <option key={item.value} value={item.value} disabled={!item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Contact Number</label>
            <input
              type="tel"
              required
              value={studentForm.contact_number}
              onChange={(e) => setStudentForm({ ...studentForm, contact_number: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg mt-4"
          >
            {editingStudentId ? 'Save Changes' : 'Create Account'}
          </button>
        </form>
      </Modal>

      {/* Confirmation Modal for Student Deletion */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setStudentToDelete(null);
        }}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-medium">
              Are you sure you want to delete this student?
            </p>
          </div>

          {studentToDelete && (
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 text-sm text-slate-300">
              <p><span className="text-slate-400">Name:</span> {studentToDelete.first_name} {studentToDelete.last_name}</p>
              <p><span className="text-slate-400">Email:</span> {studentToDelete.email}</p>
            </div>
          )}

          <p className="text-xs text-slate-400">
            This action cannot be undone. The student's account and associated data will be permanently removed.
          </p>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setStudentToDelete(null);
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete Student'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}