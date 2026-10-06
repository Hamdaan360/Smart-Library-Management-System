import React, { useState } from 'react';
import { Fine, Student } from '../../types';
import { updateFineStatus, imposeStudentFine } from '../../lib/libraryService';
import { useAuth } from '../../context/AuthContext';
import {
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Loader2,
  X,
  PlusCircle,
  DollarSign,
  User,
  BookOpen,
} from 'lucide-react';

interface Props {
  fines: Fine[];
  students?: Student[];
  onRefresh: () => void;
}

export const AdminFines: React.FC<Props> = ({ fines, students = [], onRefresh }) => {
  const { adminProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'waived'>('all');

  // Waive modal
  const [waivingFine, setWaivingFine] = useState<Fine | null>(null);
  const [waiverReason, setWaiverReason] = useState('Medical Leave Exemption approved by HOD');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Impose Fine modal states
  const [isImposeOpen, setIsImposeOpen] = useState(false);
  const [imposeLoading, setImposeLoading] = useState(false);
  const [selectedStudentDocId, setSelectedStudentDocId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualRollNumber, setManualRollNumber] = useState('');
  const [fineAmount, setFineAmount] = useState<number>(50);
  const [fineReasonCategory, setFineReasonCategory] = useState('Overdue Book Return');
  const [relatedBookTitle, setRelatedBookTitle] = useState('');
  const [fineNotes, setFineNotes] = useState('');

  const handleMarkPaid = async (fine: Fine) => {
    setLoadingId(fine.id);
    setFeedback(null);
    try {
      await updateFineStatus(fine.id, 'paid', undefined, adminProfile?.name || 'Chief Librarian');
      setFeedback({
        type: 'success',
        text: `Fine of ₹${fine.amount} for "${fine.bookTitle}" marked as PAID.`,
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update fine.' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirmWaive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waivingFine) return;

    setLoadingId(waivingFine.id);
    setFeedback(null);
    try {
      await updateFineStatus(
        waivingFine.id,
        'waived',
        waiverReason.trim(),
        adminProfile?.name || 'Chief Librarian'
      );
      setFeedback({
        type: 'success',
        text: `Fine of ₹${waivingFine.amount} waived with reason: "${waiverReason}".`,
      });
      setWaivingFine(null);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to waive fine.' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleImposeFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fineAmount <= 0) {
      setFeedback({ type: 'error', text: 'Please enter a valid fine amount greater than ₹0.' });
      return;
    }

    setImposeLoading(true);
    setFeedback(null);

    try {
      let targetStudentId = manualStudentId.trim();
      let targetStudentName = manualStudentName.trim();
      let targetRoll = manualRollNumber.trim();
      let targetUid = '';

      if (selectedStudentDocId) {
        const found = students.find((s) => s.id === selectedStudentDocId);
        if (found) {
          targetStudentId = found.studentId;
          targetStudentName = found.name;
          targetRoll = found.rollNumber;
          targetUid = found.uid || '';
        }
      }

      if (!targetStudentName || !targetStudentId) {
        throw new Error('Please select an enrolled student or enter the student ID and name.');
      }

      await imposeStudentFine(
        {
          studentId: targetStudentId,
          studentName: targetStudentName,
          rollNumber: targetRoll,
          studentUid: targetUid,
          amount: fineAmount,
          reason: fineReasonCategory,
          bookTitle: relatedBookTitle.trim() || fineReasonCategory,
          notes: fineNotes.trim(),
        },
        {
          uid: adminProfile?.uid || 'admin-hamdaan',
          name: adminProfile?.name || 'Hamdaan (Chief Administrator)',
        }
      );

      setFeedback({
        type: 'success',
        text: `Fine of ₹${fineAmount} imposed successfully on ${targetStudentName} (${targetStudentId}) for ${fineReasonCategory}.`,
      });

      // Reset modal state
      setIsImposeOpen(false);
      setSelectedStudentDocId('');
      setManualStudentName('');
      setManualStudentId('');
      setManualRollNumber('');
      setRelatedBookTitle('');
      setFineNotes('');
      setFineAmount(50);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to impose fine.' });
    } finally {
      setImposeLoading(false);
    }
  };

  const filteredFines = fines.filter((f) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      f.studentName.toLowerCase().includes(term) ||
      f.studentId.toLowerCase().includes(term) ||
      f.bookTitle.toLowerCase().includes(term);

    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCollected = fines
    .filter((f) => f.status === 'paid')
    .reduce((acc, f) => acc + (f.amount || 0), 0);

  const totalOutstanding = fines
    .filter((f) => f.status === 'unpaid')
    .reduce((acc, f) => acc + (f.amount || 0), 0);

  const totalWaived = fines
    .filter((f) => f.status === 'waived')
    .reduce((acc, f) => acc + (f.amount || 0), 0);

  const searchedStudents = students.filter((s) => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.stream.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Fine Records & Clearance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Impose library penalties, collect overdue fine payments, and manage official fee waivers
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Main Action Button: Impose Fine on Student */}
          <button
            onClick={() => setIsImposeOpen(true)}
            id="impose-fine-button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md shadow-rose-900/10 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Impose Fine (जुर्माना लगाएं)
          </button>

          {/* 3 Metric Summary pills */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Collected</span>
              <span className="font-black text-emerald-800">₹{totalCollected}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Pending Dues</span>
              <span className="font-black text-rose-800">₹{totalOutstanding}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Waived</span>
              <span className="font-black text-blue-800">₹{totalWaived}</span>
            </div>
          </div>
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

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search fines by Student Name, Student ID, or Book Title..."
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
        >
          <option value="all">All Fine Records ({fines.length})</option>
          <option value="unpaid">Unpaid Overdue Fines</option>
          <option value="paid">Settled / Paid</option>
          <option value="waived">Waived by Administration</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Reason / Book Title</th>
                <th className="p-3.5 text-center">Overdue Days</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No fine records matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredFines.map((fine) => (
                  <tr key={fine.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{fine.studentName}</div>
                      <div className="text-[11px] text-slate-500">
                        {fine.studentId} • Roll: {fine.rollNumber}
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="font-medium text-slate-800 line-clamp-1">{fine.bookTitle}</div>
                      {fine.notes && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">{fine.notes}</div>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {fine.overdueDays > 0 ? (
                        <span className="font-bold text-rose-700">{fine.overdueDays} days</span>
                      ) : (
                        <span className="text-slate-400">Penalty</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-sm text-slate-900">₹{fine.amount}</span>
                    </td>
                    <td className="p-3.5">
                      {fine.status === 'unpaid' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Unpaid
                        </span>
                      )}
                      {fine.status === 'paid' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Paid
                        </span>
                      )}
                      {fine.status === 'waived' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          Waived
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {fine.status === 'unpaid' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleMarkPaid(fine)}
                            disabled={loadingId === fine.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors flex items-center gap-1 disabled:opacity-50"
                            title="Mark as Paid at Desk"
                          >
                            {loadingId === fine.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            Collect ₹{fine.amount}
                          </button>
                          <button
                            onClick={() => {
                              setWaivingFine(fine);
                              setWaiverReason('Medical / Academic Exemption granted by HOD');
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-[11px] transition-colors"
                          >
                            Waive
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {fine.status === 'paid' ? `Settled on ${fine.paidAt?.split('T')[0] || 'Desk'}` : 'Waived'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: IMPOSE FINE ON STUDENT */}
      {isImposeOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5 text-slate-900">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Impose Fine on Student (जुर्माना लगाएं)</h3>
                  <p className="text-xs text-slate-500">Apply a penalty record directly to a student profile</p>
                </div>
              </div>
              <button
                onClick={() => setIsImposeOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImposeFine} className="space-y-4 pt-4 text-xs">
              {/* Select or Enter Student */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Select Enrolled Student *
                </label>
                {students.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedStudentDocId}
                      onChange={(e) => {
                        setSelectedStudentDocId(e.target.value);
                        if (e.target.value) {
                          const found = students.find((s) => s.id === e.target.value);
                          if (found) {
                            setManualStudentName(found.name);
                            setManualStudentId(found.studentId);
                            setManualRollNumber(found.rollNumber);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                    >
                      <option value="">-- Choose from Enrolled Students ({students.length}) --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.studentId} • Roll: {s.rollNumber} • {s.stream})
                        </option>
                      ))}
                    </select>

                    <p className="text-[11px] text-slate-400">
                      Or type student details below if not enrolled in list:
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mb-2">
                    No enrolled students in database yet. Enter student details manually below:
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Student ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VVUC-2024-001"
                      value={manualStudentId}
                      onChange={(e) => setManualStudentId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={manualStudentName}
                      onChange={(e) => setManualStudentName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                      Roll No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 105"
                      value={manualRollNumber}
                      onChange={(e) => setManualRollNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Fine Reason / Category */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Penalty Category / Violation *
                </label>
                <select
                  value={fineReasonCategory}
                  onChange={(e) => setFineReasonCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                >
                  <option value="Overdue Book Return">Overdue Book Return (विलंबित पुस्तक वापसी)</option>
                  <option value="Damaged Book Pages / Torn Spine">Damaged Book / Torn Spine (पुस्तक को नुकसान)</option>
                  <option value="Lost Library Book Replacement">Lost Library Book (खोई हुई पुस्तक)</option>
                  <option value="Late Submission Penalty">Late Return / Exam Week Penalty</option>
                  <option value="Library Silence & Discipline Violation">Library Discipline / Noise Violation (अनुशासनहीनता)</option>
                  <option value="ID Card Misuse / Unauthorized Access">Library Card Misuse</option>
                  <option value="Custom Administrative Fine">Other Custom Reason</option>
                </select>
              </div>

              {/* Related Book or Subject */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  3. Book Title / Related Item (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Financial Accounting Volume 1 or General Library Fine"
                  value={relatedBookTitle}
                  onChange={(e) => setRelatedBookTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>

              {/* Fine Amount (INR) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  4. Fine Amount (₹ INR) *
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={fineAmount}
                      onChange={(e) => setFineAmount(parseInt(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 font-bold text-sm focus:ring-2 focus:ring-rose-600 focus:outline-none"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1">
                    {[20, 50, 100, 200].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFineAmount(preset)}
                        className={`px-2.5 py-2 rounded-lg font-bold text-xs border transition-colors ${
                          fineAmount === preset
                            ? 'bg-rose-700 text-white border-rose-700'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes / Remarks */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  5. Additional Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional incident notes, copy barcode, or receipt reference..."
                  value={fineNotes}
                  onChange={(e) => setFineNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImposeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={imposeLoading}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {imposeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  Confirm & Impose Fine (₹{fineAmount})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waive Modal */}
      {waivingFine && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-base">Grant Administrative Waiver</h3>
              </div>
              <button
                onClick={() => setWaivingFine(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmWaive} className="space-y-4 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p>
                  Student: <strong>{waivingFine.studentName}</strong> ({waivingFine.studentId})
                </p>
                <p>
                  Book / Reason: <strong>{waivingFine.bookTitle}</strong>
                </p>
                <p>
                  Outstanding Amount: <strong className="text-rose-700 font-bold">₹{waivingFine.amount}</strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Official Justification / Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  placeholder="e.g. Student provided valid medical certificate or exam conflict approved by HOD..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWaivingFine(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingId === waivingFine.id}
                  className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5"
                >
                  Confirm Official Waiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
