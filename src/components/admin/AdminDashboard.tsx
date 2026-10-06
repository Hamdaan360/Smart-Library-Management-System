import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  BookMarked,
  AlertTriangle,
  Users,
  UserCheck,
  UserX,
  Receipt,
  Clock,
  ArrowUpRight,
  TrendingUp,
  History,
  Repeat,
  PlusCircle,
} from 'lucide-react';
import { Book, Student, IssueTransaction, Fine, ActivityLog } from '../../types';

interface Props {
  books: Book[];
  students: Student[];
  issues: IssueTransaction[];
  fines: Fine[];
  activityLogs: ActivityLog[];
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  books,
  students,
  issues,
  fines,
  activityLogs,
  onNavigate,
}) => {
  const totalBooks = books.reduce((acc, b) => acc + (b.totalCopies || 0), 0);
  const availableBooks = books.reduce((acc, b) => acc + (b.availableCopies || 0), 0);

  const activeIssues = issues.filter((i) => i.status === 'issued' || i.status === 'overdue');
  const issuedBooksCount = activeIssues.length;

  const today = new Date().toISOString().split('T')[0];
  const overdueCount = activeIssues.filter(
    (i) => i.status === 'overdue' || (i.dueDate < today && i.status !== 'returned')
  ).length;

  const totalRegisteredStudents = students.length;
  const verifiedStudents = students.filter((s) => s.verified).length;
  const pendingVerifications = students.filter((s) => !s.verified).length;

  const collectedFines = fines
    .filter((f) => f.status === 'paid')
    .reduce((acc, f) => acc + (f.amount || 0), 0);

  const pendingFines = fines
    .filter((f) => f.status === 'unpaid')
    .reduce((acc, f) => acc + (f.amount || 0), 0);

  const formatLogTimestamp = (log: ActivityLog) => {
    if (log.date && log.time) {
      return `${log.date} ${log.time}`;
    }
    if (log.date) {
      return log.date;
    }
    const rawTs: unknown = log.timestamp;
    if (typeof rawTs === 'number') {
      const d = new Date(rawTs);
      if (!isNaN(d.getTime())) {
        return `${d.toISOString().split('T')[0]} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    }
    if (typeof rawTs === 'string') {
      if (rawTs.includes('T')) {
        const parts = rawTs.split('T');
        return `${parts[0]} ${parts[1]?.substring(0, 5) || ''}`.trim();
      }
      return rawTs;
    }
    if (rawTs && typeof (rawTs as any)?.toDate === 'function') {
      const d = (rawTs as any).toDate();
      return `${d.toISOString().split('T')[0]} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return log.time || 'Recent';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Royal Navy & Gold */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#071129] p-6 rounded-3xl border-2 border-amber-500/30 text-white shadow-xl">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
            VVUC Circulation Operations • Single Super Admin Desk (Hamdaan)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Vidya Vikas Universal College Library Overview
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Monitor real-time inventory movements, student clearances, and circulation metrics
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('issue-return')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:brightness-105 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Repeat className="w-3.5 h-3.5" />
            Issue / Return Desk
          </button>
          <button
            onClick={() => onNavigate('books')}
            className="px-4 py-2.5 rounded-xl bg-[#0c1a40] hover:bg-[#122456] text-amber-300 border border-amber-400/40 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            Add New Title
          </button>
        </div>
      </div>

      {/* Primary 9 Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* 1. Total Books */}
        <div
          onClick={() => onNavigate('books')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Books
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalBooks}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">{books.length} unique catalog titles</p>
          </div>
        </div>

        {/* 2. Available Books */}
        <div
          onClick={() => onNavigate('books')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Available on Shelf
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{availableBooks}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Ready for immediate loan</p>
          </div>
        </div>

        {/* 3. Issued Books */}
        <div
          onClick={() => onNavigate('issue-return')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Currently Issued
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-900">{issuedBooksCount}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Active loans to students</p>
          </div>
        </div>

        {/* 4. Overdue Books */}
        <div
          onClick={() => onNavigate('issue-return')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Overdue Books
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700">{overdueCount}</div>
            <p className="text-[10px] text-rose-600 mt-0.5">Past circulation due date</p>
          </div>
        </div>

        {/* 5. Registered Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-400 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Students
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalRegisteredStudents}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">College library members</p>
          </div>
        </div>

        {/* 6. Verified Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Verified Students
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-800">{verifiedStudents}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Eligible for book issue</p>
          </div>
        </div>

        {/* 7. Pending Verifications */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Verifications
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700">{pendingVerifications}</div>
            <p className="text-[10px] text-amber-600 mt-0.5">Awaiting staff confirmation</p>
          </div>
        </div>

        {/* 8. Fines Collected */}
        <div
          onClick={() => onNavigate('fines')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Fines Collected
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-800">₹{collectedFines}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Settled at circulation counter</p>
          </div>
        </div>

        {/* 9. Pending Fines */}
        <div
          onClick={() => onNavigate('fines')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Fines
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700">₹{pendingFines}</div>
            <p className="text-[10px] text-rose-600 mt-0.5">Outstanding overdue penalties</p>
          </div>
        </div>
      </div>

      {/* Activity Logs & Quick Circulation Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Logs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-900" />
              <h3 className="text-sm font-bold text-slate-900">Recent Circulation Activity Logs</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Automated Audit Trail</span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
            {activityLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No activity logs recorded yet.</p>
            ) : (
              activityLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800">{log.details}</p>
                    <p className="text-[10px] text-slate-400">
                      Performed by <strong className="text-slate-600">{(log as any).performedBy || log.adminName || 'Admin'}</strong>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {formatLogTimestamp(log)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Help & Short Stats */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-amber-300">Quick Circulation Guide</h3>
          <ul className="text-xs text-slate-300 space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <span>Issue books only to verified students with active enrollment status.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <span>Atomic transactions ensure book availability numbers are decremented immediately.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <span>When a reserved book is returned, the next student in queue is notified automatically.</span>
            </li>
          </ul>

          <div className="pt-3 border-t border-white/10">
            <button
              onClick={() => onNavigate('settings')}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
            >
              Configure Circulation Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
