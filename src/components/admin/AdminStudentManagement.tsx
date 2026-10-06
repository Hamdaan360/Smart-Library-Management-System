import React, { useState, useEffect } from 'react';
import { Student, IssueTransaction, Fine, STUDENT_STREAMS, StudentAuthLog } from '../../types';
import {
  updateStudentStatus,
  adminUpdateStudent,
  addStudentToRoster,
  deleteStudent,
  clearAllBooksAndStudents,
  getStudentAuthLogs,
} from '../../lib/libraryService';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Eye,
  AlertCircle,
  X,
  Loader2,
  BookMarked,
  Receipt,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  RotateCcw,
  Smartphone,
  History,
  RefreshCw,
  Clock,
  KeyRound,
} from 'lucide-react';

interface Props {
  students: Student[];
  issues: IssueTransaction[];
  fines: Fine[];
  onRefresh: () => void;
}

export const AdminStudentManagement: React.FC<Props> = ({ students, issues, fines, onRefresh }) => {
  const { adminProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // View mode switcher: 'roster' vs 'auth_logs'
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'auth_logs'>('roster');
  const [authLogs, setAuthLogs] = useState<StudentAuthLog[]>([]);
  const [loadingAuthLogs, setLoadingAuthLogs] = useState(false);
  const [authLogsSearchTerm, setAuthLogsSearchTerm] = useState('');

  const fetchAuthLogs = async () => {
    setLoadingAuthLogs(true);
    try {
      const logs = await getStudentAuthLogs();
      setAuthLogs(logs);
    } catch (err) {
      console.warn('Failed to fetch student auth logs:', err);
    } finally {
      setLoadingAuthLogs(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'auth_logs') {
      fetchAuthLogs();
    }
  }, [activeSubTab]);

  // Inspection Modal
  const [inspectStudent, setInspectStudent] = useState<Student | null>(null);

  // Edit Modal
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});

  // Add Student Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    studentId: '',
    rollNumber: '',
    stream: 'FYJC Science',
    classYear: 'FYJC',
    division: 'A',
    email: '',
    mobile: '',
  });

  // Clear confirmation modal
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Combine default predefined streams with any custom streams in database
  const availableStreams = Array.from(new Set([...STUDENT_STREAMS, ...students.map((s) => s.stream).filter(Boolean)]));

  const handleToggleVerification = async (student: Student, verified: boolean) => {
    try {
      await updateStudentStatus(student.id, { verified }, adminProfile?.name || 'Chief Librarian');
      setFeedback({
        type: 'success',
        text: `Student ${student.name} is now ${verified ? 'Verified & Eligible for Loans' : 'Unverified'}.`,
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Action failed.' });
    }
  };

  const handleToggleActive = async (student: Student, active: boolean) => {
    try {
      await updateStudentStatus(student.id, { active }, adminProfile?.name || 'Chief Librarian');
      setFeedback({
        type: 'success',
        text: `Student account ${student.name} has been ${active ? 'Activated' : 'Deactivated'}.`,
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Action failed.' });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    setLoading(true);
    setFeedback(null);
    try {
      await adminUpdateStudent(editStudent.id, editForm, adminProfile?.name || 'Chief Librarian');
      setFeedback({ type: 'success', text: `Student ${editStudent.name} updated successfully.` });
      setEditStudent(null);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error updating student record.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.studentId.trim() || !addForm.rollNumber.trim()) {
      setFeedback({ type: 'error', text: 'Name, Student ID, and Roll Number are required.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      await addStudentToRoster(
        {
          name: addForm.name.trim(),
          studentId: addForm.studentId.trim(),
          rollNumber: addForm.rollNumber.trim(),
          stream: addForm.stream,
          classYear: addForm.classYear,
          division: addForm.division.trim() || 'A',
          email: addForm.email.trim(),
          mobile: addForm.mobile.trim(),
          isVerified: true,
          accountStatus: 'active',
          registeredAt: new Date().toISOString(),
        },
        {
          uid: adminProfile?.uid || 'admin-hamdaan',
          name: adminProfile?.name || 'Hamdaan (Chief Administrator)',
        }
      );

      setFeedback({
        type: 'success',
        text: `Student ${addForm.name} (${addForm.studentId}) successfully registered!`,
      });
      setIsAddOpen(false);
      setAddForm({
        name: '',
        studentId: '',
        rollNumber: '',
        stream: 'FYJC Science',
        classYear: 'FYJC',
        division: 'A',
        email: '',
        mobile: '',
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to add student.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to remove student "${student.name}" (${student.studentId}) from the library records?`)) {
      return;
    }

    try {
      await deleteStudent(student.id, {
        uid: adminProfile?.uid || 'admin-hamdaan',
        name: adminProfile?.name || 'Hamdaan (Chief Administrator)',
      });
      setFeedback({ type: 'success', text: `Student record ${student.name} removed.` });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Could not delete student.' });
    }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      const res = await clearAllBooksAndStudents({
        uid: adminProfile?.uid || 'admin-hamdaan',
        name: adminProfile?.name || 'Hamdaan (Chief Administrator)',
      });
      setFeedback({
        type: 'success',
        text: `Cleared pre-existing library data: Removed ${res.deletedBooks} books and ${res.deletedStudents} students. Ready for fresh data!`,
      });
      setIsClearConfirmOpen(false);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to clear data.' });
    } finally {
      setIsClearing(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      s.name.toLowerCase().includes(term) ||
      s.studentId.toLowerCase().includes(term) ||
      s.rollNumber.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term);

    const matchVerif =
      verificationFilter === 'all' ||
      (verificationFilter === 'verified' && s.verified) ||
      (verificationFilter === 'unverified' && !s.verified);

    const matchStream = streamFilter === 'all' || s.stream === streamFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.active) ||
      (statusFilter === 'inactive' && !s.active);

    return matchSearch && matchVerif && matchStream && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Student Member Registry & Auth Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage college student enrollments, issue library cards, and track Firebase sign-in / OTP authentication logs
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Add Student Button */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Student
          </button>

          {/* Clear Pre-existing Data Button (if desired) */}
          <button
            onClick={() => setIsClearConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
            title="Clear all demo books and students"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Sample Data
          </button>
        </div>
      </div>

      {/* View Switcher: Student Roster vs Firebase Auth Logs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'roster'
              ? 'bg-[#071129] text-amber-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Student Roster ({students.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('auth_logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'auth_logs'
              ? 'bg-[#071129] text-amber-300 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-emerald-400" />
          Firebase Sign-in & Login Logs
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 text-[10px] font-black border border-emerald-300">
            Firestore
          </span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <p className="font-semibold">{feedback.text}</p>
        </div>
      )}

      {activeSubTab === 'roster' && (
        <>
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Student Name, Student ID (e.g. VVUC-2024-001), Roll No, or Email..."
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Verification Status
            </label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="all">All Verification States</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Pending / Unverified</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Stream / Category
            </label>
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="all">All Streams ({availableStreams.length})</option>
              {availableStreams.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Account Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Members</option>
              <option value="inactive">Deactivated Members</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Student Details</th>
                <th className="p-3.5">ID / Roll</th>
                <th className="p-3.5">Category / Stream</th>
                <th className="p-3.5">Class & Div</th>
                <th className="p-3.5">Verification</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No student records found matching the criteria.
                    {students.length === 0 && (
                      <div className="mt-2 text-xs text-blue-900 font-medium">
                        Click "+ Add New Student" above to enroll your first student.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => {
                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-xs">
                            {stu.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">{stu.name}</p>
                            <p className="text-[11px] text-slate-500">{stu.email || 'No email specified'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p className="font-mono font-bold text-blue-950">{stu.studentId}</p>
                        <p className="font-mono text-[11px] text-slate-500">Roll: {stu.rollNumber}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 font-semibold text-[11px] border border-blue-200">
                          {stu.stream}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-800">
                          {stu.classYear} - Div {stu.division}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            stu.verified
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {stu.verified ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3 h-3" />
                              Unverified
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            stu.active
                              ? 'bg-blue-50 text-blue-900 border border-blue-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {stu.active ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Inspection Modal button */}
                          <button
                            onClick={() => setInspectStudent(stu)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-100"
                            title="Inspect Student Profile & History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Verify / Unverify toggle */}
                          {stu.verified ? (
                            <button
                              onClick={() => handleToggleVerification(stu, false)}
                              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50"
                              title="Revoke Verification"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleVerification(stu, true)}
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50"
                              title="Verify Student"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setEditStudent(stu);
                              setEditForm({ ...stu });
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-100"
                            title="Edit Student Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteStudent(stu)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                            title="Delete Student Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

  {activeSubTab === 'auth_logs' && (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-medium block">Total Firebase Logs</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{authLogs.length}</span>
          <span className="text-[10px] text-slate-400">All student auth events</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-emerald-700 font-medium block">Successful Auth</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">
            {authLogs.filter((l) => l.status === 'success').length}
          </span>
          <span className="text-[10px] text-emerald-600/80">Valid registrations & logins</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-blue-800 font-medium block">Mobile OTP Verified</span>
          <span className="text-xl font-black text-blue-700 mt-1 block">
            {authLogs.filter((l) => l.method === 'otp').length}
          </span>
          <span className="text-[10px] text-blue-600">SMS OTP verifications</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-rose-700 font-medium block">Failed Attempts</span>
          <span className="text-xl font-black text-rose-600 mt-1 block">
            {authLogs.filter((l) => l.status === 'failed').length}
          </span>
          <span className="text-[10px] text-rose-500">Wrong credentials or OTP</span>
        </div>
      </div>

      {/* Search & Refresh Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={authLogsSearchTerm}
            onChange={(e) => setAuthLogsSearchTerm(e.target.value)}
            placeholder="Search Firebase auth logs by Student Name, ID, Mobile number, or Email..."
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>
        <button
          type="button"
          onClick={fetchAuthLogs}
          disabled={loadingAuthLogs}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingAuthLogs ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Student Details</th>
                <th className="p-3.5">Mobile & OTP</th>
                <th className="p-3.5">Event Action</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Result</th>
                <th className="p-3.5">Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {authLogs
                .filter((log) => {
                  const term = authLogsSearchTerm.toLowerCase().trim();
                  if (!term) return true;
                  return (
                    (log.studentName || '').toLowerCase().includes(term) ||
                    (log.studentId || '').toLowerCase().includes(term) ||
                    (log.mobile || '').includes(term) ||
                    (log.email || '').toLowerCase().includes(term) ||
                    (log.details || '').toLowerCase().includes(term)
                  );
                })
                .map((log) => (
                  <tr key={log.id || Math.random().toString()} className="hover:bg-slate-50">
                    <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{log.studentName || 'Student'}</p>
                      <p className="font-mono text-[11px] text-blue-900 font-semibold">{log.studentId}</p>
                      <p className="text-[10px] text-slate-400">{log.email}</p>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1 font-mono text-slate-700">
                        <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                        {log.mobile ? `+91 ${log.mobile}` : 'N/A'}
                      </div>
                      {log.method === 'otp' && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 mt-0.5 inline-block">
                          OTP Verified
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          log.action === 'registration'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {log.action === 'registration' ? 'New Registration' : 'Student Login'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          log.method === 'otp'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {log.method === 'otp' ? (
                          <>
                            <Smartphone className="w-3 h-3" />
                            Mobile OTP
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-3 h-3" />
                            Password
                          </>
                        )}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {log.status === 'success' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Success
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Failed
                          </>
                        )}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-600 text-[11px] max-w-xs truncate">
                      {log.details || 'Auth verified in Firebase'}
                    </td>
                  </tr>
                ))}

              {authLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No Firebase authentication logs recorded yet.
                    <p className="text-[11px] text-slate-500 mt-1">
                      When students register or log in with OTP or password, their audit trail is automatically saved to Firebase Firestore and displayed here in real time.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* MODAL: ADD NEW STUDENT */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-900">
                <Users className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-base">Add New Student Member</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3.5 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VVUC-2024-001"
                    value={addForm.studentId}
                    onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101"
                    value={addForm.rollNumber}
                    onChange={(e) => setAddForm({ ...addForm, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class / Year</label>
                  <select
                    value={addForm.classYear}
                    onChange={(e) => setAddForm({ ...addForm, classYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="FYJC">FYJC</option>
                    <option value="SYJC">SYJC</option>
                    <option value="FY">FY</option>
                    <option value="SY">SY</option>
                    <option value="TY">TY</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A"
                    value={addForm.division}
                    onChange={(e) => setAddForm({ ...addForm, division: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Category / Stream *</label>
                <select
                  value={addForm.stream}
                  onChange={(e) => setAddForm({ ...addForm, stream: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {STUDENT_STREAMS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. student@gmail.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={addForm.mobile}
                    onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLEAR ALL PRE-EXISTING DATA */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-700 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Clear Pre-Existing Books & Students?</h3>
                <p className="text-xs text-slate-500">Wipe sample records to start fresh with your real data</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              This action will completely delete all pre-existing books, students, and circulation records from the library database.
              Your admin accounts and settings will remain safe. You can then immediately start adding your real college books and students.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                disabled={isClearing}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllData}
                disabled={isClearing}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Yes, Clear All Pre-Existing Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Student Profile Modal */}
      {inspectStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-900">
                <Users className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-base">Student Details & History</h3>
              </div>
              <button
                onClick={() => setInspectStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Name</span>
                  <span className="font-bold text-slate-900">{inspectStudent.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Student ID</span>
                  <span className="font-mono font-bold text-blue-950">{inspectStudent.studentId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Roll Number</span>
                  <span className="font-medium text-slate-800">{inspectStudent.rollNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Category / Stream</span>
                  <span className="font-medium text-slate-800">{inspectStudent.stream}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Class & Div</span>
                  <span className="font-medium text-slate-800">
                    {inspectStudent.classYear} - Div {inspectStudent.division}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                  <span className="font-medium text-slate-800">{inspectStudent.email || 'N/A'}</span>
                </div>
              </div>

              {/* Active issues for this student */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <BookMarked className="w-4 h-4 text-blue-900" /> Current Loans (
                  {issues.filter((i) => i.studentId === inspectStudent.studentId && i.status === 'issued').length})
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {issues
                    .filter((i) => i.studentId === inspectStudent.studentId && i.status === 'issued')
                    .map((iss) => (
                      <div
                        key={iss.id}
                        className="p-2 rounded-lg bg-blue-50/50 border border-blue-100 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{iss.bookTitle}</p>
                          <p className="text-[10px] text-slate-500">Due: {iss.dueDate}</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                          ON LOAN
                        </span>
                      </div>
                    ))}
                  {issues.filter((i) => i.studentId === inspectStudent.studentId && i.status === 'issued').length === 0 && (
                    <p className="text-slate-400 italic">No books currently on loan.</p>
                  )}
                </div>
              </div>

              {/* Unpaid fines */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-rose-700" /> Pending Fine Records (
                  {fines.filter((f) => f.studentId === inspectStudent.studentId && f.status === 'unpaid').length})
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {fines
                    .filter((f) => f.studentId === inspectStudent.studentId && f.status === 'unpaid')
                    .map((fn) => (
                      <div
                        key={fn.id}
                        className="p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{fn.bookTitle}</p>
                          <p className="text-[10px] text-rose-600 font-bold">Overdue: {fn.overdueDays} days</p>
                        </div>
                        <span className="font-bold text-rose-700 text-xs">₹{fn.amount}</span>
                      </div>
                    ))}
                  {fines.filter((f) => f.studentId === inspectStudent.studentId && f.status === 'unpaid').length === 0 && (
                    <p className="text-slate-400 italic">No pending fines for this student.</p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-900">
                <Edit2 className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-base">Edit Student Record</h3>
              </div>
              <button
                onClick={() => setEditStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student ID</label>
                  <input
                    type="text"
                    required
                    value={editForm.studentId || ''}
                    onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={editForm.mobile || ''}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category / Stream</label>
                  <select
                    value={editForm.stream || ''}
                    onChange={(e) => setEditForm({ ...editForm, stream: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {availableStreams.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class / Year</label>
                  <select
                    value={editForm.classYear || ''}
                    onChange={(e) => setEditForm({ ...editForm, classYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="FYJC">FYJC</option>
                    <option value="SYJC">SYJC</option>
                    <option value="FY">FY</option>
                    <option value="SY">SY</option>
                    <option value="TY">TY</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Division</label>
                  <input
                    type="text"
                    required
                    value={editForm.division || ''}
                    onChange={(e) => setEditForm({ ...editForm, division: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.verified || false}
                    onChange={(e) => setEditForm({ ...editForm, verified: e.target.checked })}
                    className="w-4 h-4 text-blue-900 rounded"
                  />
                  <span className="font-semibold text-slate-700">College Verified</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.active || false}
                    onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                    className="w-4 h-4 text-blue-900 rounded"
                  />
                  <span className="font-semibold text-slate-700">Account Active</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
