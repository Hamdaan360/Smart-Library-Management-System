import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BookMarked,
  Clock,
  AlertTriangle,
  BookOpen,
  BookmarkCheck,
  Receipt,
  Search,
  History,
  User,
  Bell,
  Sparkles,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { IssueTransaction, Reservation, Fine, Announcement, Book } from '../../types';

interface Props {
  books?: Book[];
  issues: IssueTransaction[];
  reservations: Reservation[];
  fines: Fine[];
  announcements: Announcement[];
  onNavigate: (tab: string) => void;
  onOpenNotifications: () => void;
  onReadEbook?: (book: Book) => void;
}

export const StudentDashboard: React.FC<Props> = ({
  books = [],
  issues,
  reservations,
  fines,
  announcements,
  onNavigate,
  onOpenNotifications,
  onReadEbook,
}) => {
  const { studentProfile } = useAuth();

  // Metrics calculations
  const currentlyIssuedList = issues.filter((i) => i.status === 'issued' || i.status === 'overdue');
  const currentlyIssuedCount = currentlyIssuedList.length;

  const today = new Date().toISOString().split('T')[0];
  const dueSoonCount = currentlyIssuedList.filter((i) => {
    const due = new Date(i.dueDate).getTime();
    const now = new Date(today).getTime();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }).length;

  const overdueList = currentlyIssuedList.filter((i) => {
    return i.status === 'overdue' || (i.dueDate < today && i.status !== 'returned');
  });
  const overdueCount = overdueList.length;

  const totalBorrowedCount = issues.length;
  const pendingReservationsCount = reservations.filter((r) => r.status === 'pending').length;

  const unpaidFines = fines.filter((f) => f.status === 'unpaid');
  const pendingFineTotal = unpaidFines.reduce((acc, f) => acc + (f.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Student Identity Card - Royal Navy & Gold */}
      <div className="bg-gradient-to-br from-[#060e24] via-[#0a1844] to-[#081330] text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-amber-500/30 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fbbf24_1px,transparent_1px)]"
          style={{ backgroundSize: '24px 24px' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/15 text-amber-300 text-xs font-bold border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Vidya Vikas Universal College (VVUC) • Student Member
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, {studentProfile?.name || 'Student'}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
              Track your borrowed books, renew titles before their due date, and browse thousands of
              academic curriculum and reference works.
            </p>
          </div>

          {/* College Identity Card Box - Navy & Gold Glass */}
          <div className="bg-[#0e1f52]/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-amber-400/30 sm:min-w-[280px] shadow-md">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-400/20 text-xs font-black text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              VVUC Verified College Identity
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Student ID:</span>
                <span className="font-mono font-bold text-amber-300">{studentProfile?.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Roll Number:</span>
                <span className="font-mono font-bold text-white">{studentProfile?.rollNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Course / Stream:</span>
                <span className="font-bold text-amber-200">{studentProfile?.stream}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Year & Division:</span>
                <span className="font-semibold text-white">
                  {studentProfile?.classYear} - Div {studentProfile?.division}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Required Dashboard Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Currently Issued */}
        <div
          onClick={() => onNavigate('my-books')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mb-2">
            <BookMarked className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{currentlyIssuedCount}</div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Currently Issued
            </p>
          </div>
        </div>

        {/* Due Soon */}
        <div
          onClick={() => onNavigate('my-books')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700">{dueSoonCount}</div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Due Soon (≤3 Days)
            </p>
          </div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => onNavigate('my-books')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700">{overdueCount}</div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Overdue Books
            </p>
          </div>
        </div>

        {/* Total Borrowed */}
        <div
          onClick={() => onNavigate('history')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalBorrowedCount}</div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Total Borrowed
            </p>
          </div>
        </div>

        {/* Pending Requests */}
        <div
          onClick={() => onNavigate('reservations')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-2">
            <BookmarkCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-black text-sky-800">{pendingReservationsCount}</div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Pending Requests
            </p>
          </div>
        </div>

        {/* Pending Fine */}
        <div
          onClick={() => onNavigate('fines')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700">₹{pendingFineTotal}</div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Pending Fine
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('catalog')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group flex flex-col justify-between"
          >
            <Search className="w-5 h-5 text-blue-900 group-hover:scale-110 transition-transform mb-2" />
            <span className="font-bold text-xs text-slate-800 group-hover:text-blue-900 block">
              Search Books
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Full Catalog</span>
          </button>

          <button
            onClick={() => onNavigate('catalog')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group flex flex-col justify-between"
          >
            <BookOpen className="w-5 h-5 text-blue-900 group-hover:scale-110 transition-transform mb-2" />
            <span className="font-bold text-xs text-slate-800 group-hover:text-blue-900 block">
              Browse Books
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">By Department</span>
          </button>

          <button
            onClick={() => onNavigate('ebooks')}
            className="p-3.5 rounded-xl border border-purple-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left group flex flex-col justify-between bg-purple-50/30"
          >
            <FileText className="w-5 h-5 text-purple-700 group-hover:scale-110 transition-transform mb-2" />
            <span className="font-bold text-xs text-slate-800 group-hover:text-purple-900 block">
              E-Books (PDF)
            </span>
            <span className="text-[10px] text-purple-600 mt-0.5">Read Softcopies</span>
          </button>

          <button
            onClick={() => onNavigate('my-books')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group flex flex-col justify-between"
          >
            <BookMarked className="w-5 h-5 text-blue-900 group-hover:scale-110 transition-transform mb-2" />
            <span className="font-bold text-xs text-slate-800 group-hover:text-blue-900 block">
              My Books
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">{currentlyIssuedCount} Active</span>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group flex flex-col justify-between"
          >
            <History className="w-5 h-5 text-blue-900 group-hover:scale-110 transition-transform mb-2" />
            <span className="font-bold text-xs text-slate-800 group-hover:text-blue-900 block">
              My History
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">All Transactions</span>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group flex flex-col justify-between"
          >
            <User className="w-5 h-5 text-blue-900 group-hover:scale-110 transition-transform mb-2" />
            <span className="font-bold text-xs text-slate-800 group-hover:text-blue-900 block">
              My Profile
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Account Details</span>
          </button>

          <button
            onClick={onOpenNotifications}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group flex flex-col justify-between"
          >
            <Bell className="w-5 h-5 text-blue-900 group-hover:scale-110 transition-transform mb-2" />
            <span className="font-bold text-xs text-slate-800 group-hover:text-blue-900 block">
              Notifications
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Alerts & Notices</span>
          </button>
        </div>
      </div>

      {/* Currently Issued Books Snippet & Active Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Issued Books */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-blue-900" />
              Currently Borrowed ({currentlyIssuedList.length})
            </h3>
            <button
              onClick={() => onNavigate('my-books')}
              className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {currentlyIssuedList.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No books currently on loan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Browse our library catalog to discover and borrow textbooks.
              </p>
              <button
                onClick={() => onNavigate('catalog')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-semibold"
              >
                Search Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentlyIssuedList.slice(0, 3).map((item) => {
                const isOverdue = item.dueDate < today && item.status !== 'returned';
                const dueTime = new Date(item.dueDate).getTime();
                const nowTime = new Date(today).getTime();
                const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-3 bg-slate-50/50"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{item.bookTitle}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Issued: {item.issueDate} • Due: <strong className="text-slate-800">{item.dueDate}</strong>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {isOverdue ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          Overdue ({Math.abs(diffDays)}d)
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                          {diffDays} days remaining
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Library Announcements
          </h3>
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No current announcements.</p>
            ) : (
              announcements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        ann.priority === 'urgent'
                          ? 'bg-rose-600 text-white'
                          : ann.priority === 'high'
                          ? 'bg-amber-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <span className="text-[10px] text-slate-400">{ann.createdDate}</span>
                  </div>
                  <h4 className="font-bold text-xs text-amber-950 leading-snug">{ann.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">{ann.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Digital Academic E-Books & Softcopies Carousel / Showcase */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-7 rounded-3xl border border-purple-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-400/30">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              VVUC Digital Softcopies & E-Books
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Instant Online Reading & Academic PDFs
            </h3>
            <p className="text-xs text-purple-200/80 max-w-xl">
              Read complete textbook softcopies and lecture notes online from anywhere. Features built-in PDF viewing, visual page reader, personal study notes, and bibliography citations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('ebooks')}
            className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition-colors self-start sm:self-center shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            Explore All E-Books
          </button>
        </div>

        {/* E-Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(books.filter((b) => b.pdfUrl || b.hasEbook).length > 0
            ? books.filter((b) => b.pdfUrl || b.hasEbook)
            : books
          )
            .slice(0, 3)
            .map((book) => (
              <div
                key={book.id}
                className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex gap-3">
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-14 h-20 object-cover rounded-lg shadow-md shrink-0 bg-slate-800"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-purple-400/20 text-purple-300 border border-purple-400/30 mb-1">
                      {book.pdfUrl ? 'PDF Softcopy Attached' : 'Visual Curriculum'}
                    </span>
                    <h4 className="font-bold text-xs text-white truncate leading-snug">
                      {book.title}
                    </h4>
                    <p className="text-[11px] text-purple-200 truncate mt-0.5">
                      {book.author}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {book.department} • Shelf {book.shelfNumber}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-300">
                    {book.ebookFileSize || 'Digital Edition'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onReadEbook?.(book)}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Read Softcopy
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
