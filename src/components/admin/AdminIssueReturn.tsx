import React, { useState } from 'react';
import { Book, Student, IssueTransaction, LibrarySettings } from '../../types';
import { issueBookTransaction, returnBookTransaction } from '../../lib/libraryService';
import { useAuth } from '../../context/AuthContext';
import {
  Repeat,
  Search,
  BookOpen,
  UserCheck,
  UserX,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Receipt,
  Loader2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  books: Book[];
  students: Student[];
  issues: IssueTransaction[];
  settings: LibrarySettings | null;
  onRefresh: () => void;
}

export const AdminIssueReturn: React.FC<Props> = ({ books, students, issues, settings, onRefresh }) => {
  const { adminProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'issue' | 'return'>('issue');

  // Issue Form State
  const [studentQuery, setStudentQuery] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const defaultDays = settings?.issuePeriodDays || 14;
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDue = new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(defaultDue);

  // Return Form State
  const [returnSearchTerm, setReturnSearchTerm] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<IssueTransaction | null>(null);
  const [finePaymentOption, setFinePaymentOption] = useState<'paid' | 'waived' | 'unpaid'>('paid');
  const [waiverReason, setWaiverReason] = useState('Medical / Academic Exemption');

  // Action status
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Issue Student Search matches
  const matchedStudents = students.filter(
    (s) =>
      studentQuery.trim() &&
      (s.name.toLowerCase().includes(studentQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(studentQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(studentQuery.toLowerCase()))
  );

  // Issue Book Search matches
  const matchedBooks = books.filter(
    (b) =>
      bookQuery.trim() &&
      (b.title.toLowerCase().includes(bookQuery.toLowerCase()) ||
        b.bookId.toLowerCase().includes(bookQuery.toLowerCase()) ||
        b.isbn.toLowerCase().includes(bookQuery.toLowerCase()))
  );

  // Active issues for return search
  const activeIssues = issues.filter((i) => i.status === 'issued' || i.status === 'overdue');
  const matchedIssues = activeIssues.filter((i) => {
    const term = returnSearchTerm.toLowerCase().trim();
    return (
      !term ||
      i.transactionId.toLowerCase().includes(term) ||
      i.studentId.toLowerCase().includes(term) ||
      i.studentName.toLowerCase().includes(term) ||
      i.bookTitle.toLowerCase().includes(term) ||
      i.bookId.toLowerCase().includes(term)
    );
  });

  // Calculate return overdue days & fine
  const calculateReturnFine = (item: IssueTransaction) => {
    const dueTime = new Date(item.dueDate).getTime();
    const todayTime = new Date(todayStr).getTime();
    const diffDays = Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24));
    const overdueDays = Math.max(0, diffDays);

    const grace = settings?.gracePeriodDays ?? 2;
    const fineRate = settings?.finePerDay ?? 5;
    const maxFine = settings?.maxFine ?? 200;

    let payableDays = Math.max(0, overdueDays - grace);
    let amount = Math.min(maxFine, payableDays * fineRate);

    return { overdueDays, fineAmount: amount };
  };

  // Submit Issue
  const handleConfirmIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedBook) return;

    if (!selectedStudent.verified) {
      setFeedback({ type: 'error', text: 'Cannot issue book: Student identity has not been verified.' });
      return;
    }
    if (!selectedStudent.active) {
      setFeedback({ type: 'error', text: 'Cannot issue book: Student account is currently deactivated.' });
      return;
    }
    if (selectedBook.availableCopies <= 0) {
      setFeedback({ type: 'error', text: 'Cannot issue book: No physical copies currently available.' });
      return;
    }

    setProcessing(true);
    setFeedback(null);
    try {
      const result = await issueBookTransaction({
        student: selectedStudent,
        book: selectedBook,
        issueDate,
        dueDate,
        issuedBy: adminProfile?.name || 'Chief Librarian',
      });

      setFeedback({
        type: 'success',
        text: `Book "${selectedBook.title}" issued to ${selectedStudent.name} successfully! (Txn ID: ${result.transactionId})`,
      });

      // Reset
      setSelectedBook(null);
      setSelectedStudent(null);
      setBookQuery('');
      setStudentQuery('');
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error executing issue transaction.' });
    } finally {
      setProcessing(false);
    }
  };

  // Submit Return
  const handleConfirmReturn = async () => {
    if (!selectedIssue) return;

    setProcessing(true);
    setFeedback(null);
    try {
      const { overdueDays, fineAmount } = calculateReturnFine(selectedIssue);

      await returnBookTransaction({
        issue: selectedIssue,
        returnDate: todayStr,
        receivedBy: adminProfile?.name || 'Chief Librarian',
        overdueDays,
        fineAmount,
        fineStatus: fineAmount > 0 ? finePaymentOption : 'paid',
        waiverReason: finePaymentOption === 'waived' ? waiverReason : undefined,
      });

      setFeedback({
        type: 'success',
        text: `Book "${selectedIssue.bookTitle}" returned by ${selectedIssue.studentName} processed! Copy replenished.`,
      });

      setSelectedIssue(null);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Error processing book return.' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Circulation Issue & Return Desk</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Process check-outs with student eligibility validation and handle check-ins with fine settlement
          </p>
        </div>

        {/* Tab switch */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('issue');
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'issue'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Issue Book (Check-out)
          </button>
          <button
            onClick={() => {
              setActiveTab('return');
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'return'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Return Book (Check-in)
          </button>
        </div>
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

      {/* ISSUE TAB */}
      {activeTab === 'issue' && (
        <form onSubmit={handleConfirmIssue} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 1: Select Student */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  Select Student Member
                </h3>
                {selectedStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentQuery('');
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:underline"
                  >
                    Change Student
                  </button>
                )}
              </div>

              {!selectedStudent ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={studentQuery}
                      onChange={(e) => setStudentQuery(e.target.value)}
                      placeholder="Type Student ID (STU-2024-001), Roll No, or Name..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {studentQuery && (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                      {matchedStudents.length === 0 ? (
                        <p className="p-3 text-xs text-slate-400 italic">No matching students found.</p>
                      ) : (
                        matchedStudents.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => setSelectedStudent(s)}
                            className="p-3 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{s.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {s.studentId} • Roll: {s.rollNumber} • {s.stream}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {s.verified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{selectedStudent.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedStudent.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedStudent.verified ? 'VERIFIED' : 'UNVERIFIED'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Student ID</span>
                      <strong className="font-mono text-slate-900">{selectedStudent.studentId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Roll Number</span>
                      <strong className="font-mono text-slate-900">{selectedStudent.rollNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Stream / Class</span>
                      <span>
                        {selectedStudent.stream} ({selectedStudent.classYear})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Account Status</span>
                      <strong className={selectedStudent.active ? 'text-emerald-700' : 'text-rose-700'}>
                        {selectedStudent.active ? 'Active' : 'Deactivated'}
                      </strong>
                    </div>
                  </div>

                  {!selectedStudent.verified && (
                    <div className="p-2 rounded-lg bg-amber-100/70 border border-amber-300 text-amber-900 text-[11px] flex items-center gap-1.5 font-medium">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      Warning: Student is not yet verified against college roster.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Select Book */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  Select Book Title
                </h3>
                {selectedBook && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBook(null);
                      setBookQuery('');
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:underline"
                  >
                    Change Book
                  </button>
                )}
              </div>

              {!selectedBook ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={bookQuery}
                      onChange={(e) => setBookQuery(e.target.value)}
                      placeholder="Type Book Code (BK-1001), ISBN, or Title..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {bookQuery && (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                      {matchedBooks.length === 0 ? (
                        <p className="p-3 text-xs text-slate-400 italic">No matching titles found.</p>
                      ) : (
                        matchedBooks.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBook(b)}
                            className="p-3 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{b.title}</p>
                              <p className="text-[10px] text-slate-500">
                                {b.author} • Shelf: {b.shelfNumber}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.availableCopies > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {b.availableCopies > 0 ? `${b.availableCopies} on Shelf` : '0 Copies'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{selectedBook.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedBook.availableCopies > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedBook.availableCopies} of {selectedBook.totalCopies} Available
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Book Code</span>
                      <strong className="font-mono text-slate-900">{selectedBook.bookId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Shelf Location</span>
                      <strong className="font-mono text-slate-900">{selectedBook.shelfNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Discipline / Category</span>
                      <span>{selectedBook.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Author</span>
                      <span>{selectedBook.author}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Dates & Confirm */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs font-bold">
                3
              </span>
              Circulation Dates & Confirmation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Date *</label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Standard college loan period: {defaultDays} days.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={!selectedStudent || !selectedBook || processing}
                className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 disabled:opacity-40"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
                Confirm & Complete Book Issue
              </button>
            </div>
          </div>
        </form>
      )}

      {/* RETURN TAB */}
      {activeTab === 'return' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Search Active Loan Transaction</h3>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={returnSearchTerm}
                onChange={(e) => setReturnSearchTerm(e.target.value)}
                placeholder="Search by Transaction ID (TXN-1001), Student ID (STU-2024-001), Student Name, or Book Title..."
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none bg-slate-50/50"
              />
            </div>

            {/* List of active loans */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Txn ID</th>
                      <th className="p-3">Student</th>
                      <th className="p-3">Book Title</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matchedIssues.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                          No active loan records match your search.
                        </td>
                      </tr>
                    ) : (
                      matchedIssues.map((item) => {
                        const isOverdue = item.dueDate < todayStr;
                        const isSelected = selectedIssue?.id === item.id;

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-blue-50/40 transition-colors ${
                              isSelected ? 'bg-blue-50 font-medium' : ''
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-slate-700">{item.transactionId}</td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{item.studentName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{item.studentId}</p>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{item.bookTitle}</td>
                            <td className="p-3 text-slate-600">{item.dueDate}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {isOverdue ? 'OVERDUE' : 'ON TIME'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSelectedIssue(item)}
                                className="px-3 py-1 rounded-lg bg-blue-900 text-white font-bold text-[11px] hover:bg-blue-800 shadow-2xs"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Selected Return Details & Fine Assessment */}
          {selectedIssue && (
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-900 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Confirm Book Check-in (Return)</h3>
                  <p className="text-xs text-slate-500">
                    Transaction ID: <strong className="font-mono text-blue-950">{selectedIssue.transactionId}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel Selection
                </button>
              </div>

              {/* Summary details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Student</span>
                  <span className="font-bold text-slate-900">{selectedIssue.studentName}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Book Title</span>
                  <span className="font-bold text-slate-900">{selectedIssue.bookTitle}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Strict Due Date</span>
                  <span className="font-bold text-slate-900">{selectedIssue.dueDate}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Return Date (Today)</span>
                  <span className="font-bold text-blue-950">{todayStr}</span>
                </div>
              </div>

              {/* Calculated Fine Calculation */}
              {(() => {
                const { overdueDays, fineAmount } = calculateReturnFine(selectedIssue);

                return (
                  <div
                    className={`p-4 rounded-xl border text-xs space-y-3 ${
                      fineAmount > 0
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        <span className="font-bold">
                          {fineAmount > 0
                            ? `Overdue Return: ${overdueDays} Days Past Due`
                            : 'No Overdue Fine Applicable'}
                        </span>
                      </div>
                      <span className="font-black text-base">₹{fineAmount}</span>
                    </div>

                    {fineAmount > 0 && (
                      <div className="space-y-2 pt-2 border-t border-rose-200">
                        <label className="block text-[11px] font-bold uppercase tracking-wider">
                          Select Fine Resolution
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <label className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="radio"
                              name="fineOpt"
                              value="paid"
                              checked={finePaymentOption === 'paid'}
                              onChange={() => setFinePaymentOption('paid')}
                            />
                            <span className="font-semibold text-slate-800">Mark as Paid (Collected Now)</span>
                          </label>

                          <label className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="radio"
                              name="fineOpt"
                              value="waived"
                              checked={finePaymentOption === 'waived'}
                              onChange={() => setFinePaymentOption('waived')}
                            />
                            <span className="font-semibold text-slate-800">Waive Fine (Librarian Exemption)</span>
                          </label>

                          <label className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="radio"
                              name="fineOpt"
                              value="unpaid"
                              checked={finePaymentOption === 'unpaid'}
                              onChange={() => setFinePaymentOption('unpaid')}
                            />
                            <span className="font-semibold text-slate-800">Record as Unpaid (Pending Due)</span>
                          </label>
                        </div>

                        {finePaymentOption === 'waived' && (
                          <div className="pt-1">
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">
                              Waiver Justification Reason
                            </label>
                            <input
                              type="text"
                              value={waiverReason}
                              onChange={(e) => setWaiverReason(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleConfirmReturn}
                  disabled={processing}
                  className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm Return & Replenish Stock
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
