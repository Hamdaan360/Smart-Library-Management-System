import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Search,
  BookMarked,
  Users,
  Clock,
  CheckCircle2,
  BellRing,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Layers,
  Award,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { getBooks, getStudents, getAllIssues, getAnnouncements, getLibrarySettings } from '../../lib/libraryService';
import { Book, Announcement, LibrarySettings } from '../../types';

interface Props {
  onOpenStudentLogin: () => void;
  onOpenStudentSignup: () => void;
  onOpenAdminLogin: () => void;
  onSearchBooks: () => void;
  onSelectBook?: (book: Book) => void;
}

export const LandingPage: React.FC<Props> = ({
  onOpenStudentLogin,
  onOpenStudentSignup,
  onOpenAdminLogin,
  onSearchBooks,
  onSelectBook,
}) => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    registeredStudents: 0,
    issuedBooks: 0,
  });
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [books, students, issues, anns, setts] = await Promise.all([
          getBooks(),
          getStudents(),
          getAllIssues(),
          getAnnouncements(),
          getLibrarySettings(),
        ]);

        const totalCopies = books.reduce((acc, b) => acc + (b.totalCopies || 0), 0);
        const availCopies = books.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
        const activeIssues = issues.filter((i) => i.status === 'issued' || i.status === 'overdue');

        setStats({
          totalBooks: totalCopies || books.length,
          availableBooks: availCopies,
          registeredStudents: students.length,
          issuedBooks: activeIssues.length,
        });

        setFeaturedBooks(books.slice(0, 4));
        setAnnouncements(anns.slice(0, 3));
        setSettings(setts);
      } catch (err) {
        console.error('Error loading landing data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* College Header Bar - Royal Navy & Gold */}
      <header className="bg-[#071129] border-b border-amber-500/25 sticky top-0 z-40 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & College Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0c1a40] via-[#10245a] to-[#081330] text-amber-300 flex items-center justify-center shadow-md border-2 border-amber-400/80 relative group">
              <BookOpen className="w-6 h-6 text-amber-400 drop-shadow-sm" />
              <span className="absolute -bottom-1 text-[8px] font-black uppercase tracking-tighter bg-amber-500 text-slate-950 px-1 rounded-sm leading-none">
                VVUC
              </span>
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 block leading-none mb-1">
                Universal Education • Mumbai
              </span>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-none">
                Vidya Vikas Universal College
              </h1>
              <p className="text-xs text-amber-200/80 font-medium">Smart Library Management System</p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onSearchBooks}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-100 bg-[#0f2252] hover:bg-[#142d6c] border border-amber-500/20 transition-colors"
            >
              <Search className="w-4 h-4 text-amber-400" />
              Search Catalog
            </button>

            <button
              onClick={onOpenStudentLogin}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-[#0c1b44] hover:bg-[#112660] border border-amber-400/40 transition-all flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Student</span> Login
            </button>

            <button
              onClick={onOpenStudentSignup}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:brightness-105 shadow-md shadow-amber-500/20 transition-all"
            >
              Sign Up
            </button>

            <button
              onClick={onOpenAdminLogin}
              className="px-3 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/50 transition-all flex items-center gap-1.5"
              title="Chief Administrator Portal"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Announcements Bar if any */}
      {announcements.length > 0 && (
        <div className="bg-[#050b1c] border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 uppercase tracking-wider shadow-xs">
              Notice
            </span>
            <span className="font-bold text-amber-300 truncate">{announcements[0].title}:</span>
            <span className="text-slate-300 truncate hidden md:inline">{announcements[0].message}</span>
          </div>
        </div>
      )}

      {/* Hero Section - Royal Navy Blue & Golden */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#050c1e] via-[#081538] to-[#071129] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fbbf24_1px,transparent_1px)]"
          style={{ backgroundSize: '28px 28px' }}
        />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold backdrop-blur-xs shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Empowering Academic Excellence • VVUC Central Library Resource Center
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Vidya Vikas Universal College
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 drop-shadow-sm">
              Smart Library Management System
            </span>
          </h2>

          <p className="text-lg sm:text-xl font-bold text-amber-400 tracking-wider">
            ✦ Discover • Borrow • Learn ✦
          </p>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-200 leading-relaxed">
            Welcome to the official digital gateway of Vidya Vikas Universal College Central Library. Access thousands
            of academic textbooks, reference journals, university curriculum resources, and manage your
            borrowing seamlessly with real-time verification and reservations.
          </p>

          {/* Main Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={onSearchBooks}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:brightness-105 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              Search Library Catalog
            </button>

            <button
              onClick={onOpenStudentSignup}
              className="px-6 py-3.5 rounded-xl bg-[#0d1d47] hover:bg-[#132860] text-amber-300 font-bold text-sm border-2 border-amber-400/40 backdrop-blur-xs transition-all flex items-center gap-2 shadow-md"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              Student Registration & Verification
            </button>

            <button
              onClick={onOpenAdminLogin}
              className="px-6 py-3.5 rounded-xl bg-[#091433] hover:bg-[#0e2050] text-amber-300 font-bold text-sm border border-amber-500/30 backdrop-blur-xs transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Chief Administrator Portal
            </button>
          </div>
        </div>

        {/* Dynamic Real-time Statistics Cards - Navy & Gold Glass */}
        <div className="max-w-6xl mx-auto mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
          <div className="bg-[#0b1739]/90 backdrop-blur-md border border-amber-400/25 p-5 rounded-2xl text-center shadow-lg hover:border-amber-400/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto mb-3">
              <BookMarked className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {loading ? '...' : stats.totalBooks}
            </div>
            <p className="text-xs font-bold text-amber-300/80 mt-1 uppercase tracking-wider">
              Total Books & Copies
            </p>
          </div>

          <div className="bg-[#0b1739]/90 backdrop-blur-md border border-amber-400/25 p-5 rounded-2xl text-center shadow-lg hover:border-amber-400/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-400/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300">
              {loading ? '...' : stats.availableBooks}
            </div>
            <p className="text-xs font-bold text-amber-300/80 mt-1 uppercase tracking-wider">
              Available on Shelf
            </p>
          </div>

          <div className="bg-[#0b1739]/90 backdrop-blur-md border border-amber-400/25 p-5 rounded-2xl text-center shadow-lg hover:border-amber-400/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-200">
              {loading ? '...' : stats.registeredStudents}
            </div>
            <p className="text-xs font-bold text-amber-300/80 mt-1 uppercase tracking-wider">
              Registered Students
            </p>
          </div>

          <div className="bg-[#0b1739]/90 backdrop-blur-md border border-amber-400/25 p-5 rounded-2xl text-center shadow-lg hover:border-amber-400/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300">
              {loading ? '...' : stats.issuedBooks}
            </div>
            <p className="text-xs font-bold text-amber-300/80 mt-1 uppercase tracking-wider">
              Books Currently Issued
            </p>
          </div>
        </div>
      </section>

      {/* Featured Catalog Books Preview */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-amber-700 block mb-1">
              Curriculum & Reference Resources • VVUC
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#071129]">
              Popular Academic Titles
            </h3>
          </div>
          <button
            onClick={onSearchBooks}
            className="text-xs font-bold text-[#0c1c46] hover:text-amber-700 flex items-center gap-1.5 group transition-colors"
          >
            <span>View Full Library Catalog ({stats.totalBooks} Volumes)</span>
            <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => onSelectBook && onSelectBook(book)}
              className="bg-white rounded-2xl border border-amber-500/20 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-400/60 transition-all flex flex-col group cursor-pointer"
            >
              <div className="h-44 bg-slate-100 overflow-hidden relative">
                <img
                  src={book.coverImage && book.coverImage.trim() ? book.coverImage.trim() : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs ${
                      book.availableCopies > 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {book.availableCopies > 0
                      ? `${book.availableCopies} Available`
                      : 'Reserved / Out of Stock'}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#071129]/90 text-amber-300 border border-amber-400/30 backdrop-blur-xs">
                    Shelf {book.shelfNumber}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded inline-block mb-1.5">
                    {book.category}
                  </span>
                  <h4 className="font-bold text-sm text-[#071129] line-clamp-1 group-hover:text-amber-700 transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{book.author}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[11px] text-slate-600">{book.bookId}</span>
                  <span className="font-bold text-[#0c1c46] group-hover:text-amber-700 group-hover:underline flex items-center gap-0.5">
                    Details <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Library Section - Royal Navy & Gold Card */}
      <section className="py-14 bg-white border-y border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-amber-700 block">
                Vidya Vikas Universal College • Mumbai
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#071129] leading-tight">
                About the Central Knowledge & Learning Resource Center
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The Vidya Vikas Universal College Central Library is a hub of academic learning, scholarship,
                and intellectual inquiry. Established to serve our undergraduate and postgraduate students,
                faculty, and researchers, the library houses an extensive collection spanning Computer Science,
                Information Technology, Commerce, Business Management, Humanities, and competitive examination
                resources.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#071129] text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/40">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#071129]">Official Identity Verification</h5>
                    <p className="text-xs text-slate-500">Only verified students with valid enrollment IDs can borrow.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#071129] text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/40">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#071129]">Automated Book Issue & Return</h5>
                    <p className="text-xs text-slate-500">Real-time inventory decrement/increment and audit logs.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#071129] text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/40">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#071129]">Fine Policy & Grace Days</h5>
                    <p className="text-xs text-slate-500">Transparent daily calculation with librarian waiver support.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#071129] text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/40">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#071129]">Reservation & Alerts</h5>
                    <p className="text-xs text-slate-500">Instant notification when unavailable books are returned.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#081330] p-6 sm:p-8 rounded-3xl border-2 border-amber-500/30 text-white shadow-xl">
              <h4 className="font-black text-amber-300 text-base mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Library Hours & Contact Directory
              </h4>
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Library Hours:</strong>
                    <p className="text-slate-300">{settings?.openingHours || 'Mon – Sat: 8:00 AM – 5:00 PM'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Campus Location:</strong>
                    <p className="text-slate-300">
                      {settings?.address || '1st floor, Vidya Vikas Universal College, Chincholi Bunder, Mumbai - 400064'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Official Library Email:</strong>
                    <p className="font-mono text-amber-300">{settings?.email || 'v.v.u.c.library@gmail.com'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-3">
                <button
                  onClick={onOpenStudentSignup}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold text-xs shadow-md hover:brightness-105 transition-all"
                >
                  Register as Student
                </button>
                <button
                  onClick={onOpenAdminLogin}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0d1d47] text-amber-300 font-bold text-xs border border-amber-400/40 hover:bg-[#132a68] transition-colors"
                >
                  Admin Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Royal Navy & Gold */}
      <footer className="bg-[#050b1c] text-slate-400 py-10 mt-auto border-t border-amber-500/25 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0d1d47] border border-amber-400/60 text-amber-300 flex items-center justify-center font-black text-xs">
              VVUC
            </div>
            <div>
              <p className="font-black text-white">
                Vidya Vikas Universal College • Smart Library Management System
              </p>
              <p className="text-[11px] text-amber-300/70">Universal Education Foundation • Mumbai</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={onSearchBooks} className="text-slate-300 hover:text-amber-300 transition-colors">
              Book Catalog
            </button>
            <button onClick={onOpenStudentLogin} className="text-slate-300 hover:text-amber-300 transition-colors">
              Student Portal
            </button>
            <button onClick={onOpenAdminLogin} className="text-slate-300 hover:text-amber-300 transition-colors">
              Chief Administrator Access
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
