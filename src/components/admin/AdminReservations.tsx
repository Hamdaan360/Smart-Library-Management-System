import React, { useState } from 'react';
import { Reservation, Book, Student } from '../../types';
import { updateReservationStatus, issueBookTransaction } from '../../lib/libraryService';
import { useAuth } from '../../context/AuthContext';
import {
  BookmarkCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Repeat,
  Loader2,
  Clock,
  Filter,
} from 'lucide-react';

interface Props {
  reservations: Reservation[];
  books: Book[];
  students: Student[];
  onRefresh: () => void;
}

export const AdminReservations: React.FC<Props> = ({ reservations, books, students, onRefresh }) => {
  const { adminProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleStatusChange = async (res: Reservation, newStatus: Reservation['status']) => {
    setLoadingId(res.id);
    setFeedback(null);
    try {
      await updateReservationStatus(res.id, newStatus, adminProfile?.name || 'Chief Librarian');
      setFeedback({
        type: 'success',
        text: `Reservation ${res.reservationId} status updated to ${newStatus.toUpperCase()}.`,
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update reservation.' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleFulfillAndIssue = async (res: Reservation) => {
    const student = students.find((s) => s.studentId === res.studentId);
    const book = books.find((b) => b.bookId === res.bookId);

    if (!student) {
      setFeedback({ type: 'error', text: `Student record (${res.studentId}) not found.` });
      return;
    }
    if (!book) {
      setFeedback({ type: 'error', text: `Book record (${res.bookId}) not found.` });
      return;
    }
    if (book.availableCopies <= 0) {
      setFeedback({ type: 'error', text: `Cannot fulfill: No copies of "${book.title}" are currently in stock.` });
      return;
    }

    setLoadingId(res.id);
    setFeedback(null);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await issueBookTransaction({
        student,
        book,
        issueDate: todayStr,
        dueDate: defaultDue,
        issuedBy: adminProfile?.name || 'Chief Librarian',
      });

      await updateReservationStatus(res.id, 'fulfilled', adminProfile?.name || 'Chief Librarian');
      setFeedback({
        type: 'success',
        text: `Reservation fulfilled! Book issued to ${student.name} with due date ${defaultDue}.`,
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to fulfill reservation.' });
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = reservations.filter((r) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      r.reservationId.toLowerCase().includes(term) ||
      r.studentName.toLowerCase().includes(term) ||
      r.studentId.toLowerCase().includes(term) ||
      r.bookTitle.toLowerCase().includes(term) ||
      r.bookId.toLowerCase().includes(term);

    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Book Reservation Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Review student waitlist queues, approve hold requests, and convert fulfilled reservations to active loans
        </p>
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Reservation ID, Student Name, Student ID, or Book..."
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
        >
          <option value="all">All Statuses ({reservations.length})</option>
          <option value="pending">Pending Queue</option>
          <option value="approved">Approved & Ready</option>
          <option value="fulfilled">Fulfilled (Issued)</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Book Requested</th>
                <th className="p-3.5">Request Date</th>
                <th className="p-3.5">Current Status</th>
                <th className="p-3.5 text-right">Librarian Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    No reservations matching current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((res) => {
                  const isLoading = loadingId === res.id;
                  const isPending = res.status === 'pending';
                  const isApproved = res.status === 'approved';

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-700">{res.reservationId}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{res.studentName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{res.studentId}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{res.bookTitle}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Code: {res.bookId}</p>
                      </td>
                      <td className="p-3.5 text-slate-600">{res.requestDate}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            res.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : res.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : res.status === 'fulfilled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {res.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin ml-auto text-blue-900" />
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(res, 'approved')}
                                  className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px]"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusChange(res, 'rejected')}
                                  className="px-2 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-[11px]"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <button
                                onClick={() => handleFulfillAndIssue(res)}
                                className="px-2.5 py-1 rounded-lg bg-blue-900 text-white hover:bg-blue-800 font-bold text-[11px] shadow-2xs flex items-center gap-1"
                              >
                                <Repeat className="w-3 h-3" />
                                Fulfill & Issue
                              </button>
                            )}

                            {!isPending && !isApproved && (
                              <span className="text-[11px] text-slate-400 font-medium">Closed</span>
                            )}
                          </div>
                        )}
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
  );
};
