import React, { useEffect, useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { LoginModal } from './components/landing/LoginModal';
import { StudentVerificationModal } from './components/landing/StudentVerificationModal';
import { BookCatalog } from './components/common/BookCatalog';
import { BookDetailsModal } from './components/common/BookDetailsModal';
import { SMSNotificationBanner } from './components/common/SMSNotificationBanner';

// Student Components
import { StudentNavbar } from './components/student/StudentNavbar';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentMyBooks } from './components/student/StudentMyBooks';
import { BorrowingHistory } from './components/student/BorrowingHistory';
import { StudentFines } from './components/student/StudentFines';
import { StudentReservations } from './components/student/StudentReservations';
import { StudentProfile } from './components/student/StudentProfile';
import { StudentNotificationsModal } from './components/student/StudentNotificationsModal';
import { StudentEbookReaderModal } from './components/student/StudentEbookReaderModal';

// Admin Components
import { AdminNavbar } from './components/admin/AdminNavbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminBookManagement } from './components/admin/AdminBookManagement';
import { AdminStudentManagement } from './components/admin/AdminStudentManagement';
import { AdminIssueReturn } from './components/admin/AdminIssueReturn';
import { AdminReservations } from './components/admin/AdminReservations';
import { AdminFines } from './components/admin/AdminFines';
import { AdminReports } from './components/admin/AdminReports';
import { AdminSettings } from './components/admin/AdminSettings';

// Service & Types
import {
  getBooks,
  getStudents,
  getAllIssues,
  getStudentIssues,
  getStudentFines,
  getAllFines,
  getStudentReservations,
  getAllReservations,
  getStudentNotifications,
  getAnnouncements,
  getLibrarySettings,
  getActivityLogs,
  seedInitialLibraryData,
} from './lib/libraryService';
import {
  Book,
  Student,
  IssueTransaction,
  Fine,
  Reservation,
  LibraryNotification,
  Announcement,
  LibrarySettings,
  ActivityLog,
} from './types';
import { ArrowLeft, Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, role, studentProfile, loading: authLoading } = useAuth();

  // Navigation tabs
  const [studentTab, setStudentTab] = useState('dashboard');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [isPublicCatalogView, setIsPublicCatalogView] = useState(false);

  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginInitialRole, setLoginInitialRole] = useState<'student' | 'admin'>('student');
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [selectedBookForModal, setSelectedBookForModal] = useState<Book | null>(null);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [activeStudentEbook, setActiveStudentEbook] = useState<Book | null>(null);

  // Shared Data State
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allIssues, setAllIssues] = useState<IssueTransaction[]>([]);
  const [allFines, setAllFines] = useState<Fine[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [librarySettings, setLibrarySettings] = useState<LibrarySettings | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Student specific data
  const [studentIssues, setStudentIssues] = useState<IssueTransaction[]>([]);
  const [studentFines, setStudentFines] = useState<Fine[]>([]);
  const [studentReservations, setStudentReservations] = useState<Reservation[]>([]);
  const [studentNotifications, setStudentNotifications] = useState<LibraryNotification[]>([]);

  const [loadingData, setLoadingData] = useState(true);

  // Load all system data
  const refreshData = useCallback(async () => {
    try {
      // 1. Check if database has books, if empty seed automatically
      let bList = await getBooks();
      if (bList.length === 0) {
        await seedInitialLibraryData();
        bList = await getBooks();
      }

      setBooks(bList);

      const [stuList, issList, finList, resList, annList, setts, logs] = await Promise.all([
        getStudents(),
        getAllIssues(),
        getAllFines(),
        getAllReservations(),
        getAnnouncements(),
        getLibrarySettings(),
        getActivityLogs(),
      ]);

      setStudents(stuList);
      setAllIssues(issList);
      setAllFines(finList);
      setAllReservations(resList);
      setAnnouncements(annList);
      setLibrarySettings(setts);
      setActivityLogs(logs);

      // If student is logged in, refresh their specific records
      if (studentProfile) {
        const [sIss, sFin, sRes, sNot] = await Promise.all([
          getStudentIssues(studentProfile.studentId),
          getStudentFines(studentProfile.studentId),
          getStudentReservations(studentProfile.studentId),
          getStudentNotifications(studentProfile.studentId),
        ]);
        setStudentIssues(sIss);
        setStudentFines(sFin);
        setStudentReservations(sRes);
        setStudentNotifications(sNot);
      }
    } catch (err) {
      console.error('Error refreshing library data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [studentProfile]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleOpenStudentLogin = () => {
    setLoginInitialRole('student');
    setLoginModalOpen(true);
  };

  const handleOpenAdminLogin = () => {
    setLoginInitialRole('admin');
    setLoginModalOpen(true);
  };

  const handleOpenStudentSignup = () => {
    setSignupModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-xs font-semibold text-slate-300">
            Connecting to Vidya Vikas Universal College Library Cloud...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* RENDER VIEW ACCORDING TO ROLE */}
      {role === 'student' ? (
        // STUDENT PORTAL VIEW
        <div className="flex-1 flex flex-col">
          <StudentNavbar
            activeTab={studentTab}
            setActiveTab={setStudentTab}
            notifications={studentNotifications}
            onOpenNotifications={() => setNotificationsModalOpen(true)}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
            {studentTab === 'dashboard' && (
              <StudentDashboard
                books={books}
                issues={studentIssues}
                reservations={studentReservations}
                fines={studentFines}
                announcements={announcements}
                onNavigate={setStudentTab}
                onOpenNotifications={() => setNotificationsModalOpen(true)}
                onReadEbook={(b) => setActiveStudentEbook(b)}
              />
            )}

            {studentTab === 'catalog' && (
              <BookCatalog
                books={books}
                onSelectBook={(book) => setSelectedBookForModal(book)}
                title="Academic Library Catalog"
                subtitle="Explore textbooks, syllabi reference books, and reserve copies"
              />
            )}

            {studentTab === 'ebooks' && (
              <div className="space-y-6">
                <BookCatalog
                  books={books}
                  onSelectBook={(book) => setSelectedBookForModal(book)}
                  title="Academic E-Books & Softcopies (PDFs)"
                  subtitle="Browse digital editions, syllabi textbooks, and open-access reference PDFs"
                />
              </div>
            )}

            {studentTab === 'my-books' && (
              <StudentMyBooks
                issues={studentIssues}
                books={books}
                onBrowseBooks={() => setStudentTab('catalog')}
                onReadEbook={(b) => setActiveStudentEbook(b)}
              />
            )}

            {studentTab === 'history' && <BorrowingHistory issues={studentIssues} />}

            {studentTab === 'reservations' && (
              <StudentReservations
                reservations={studentReservations}
                onBrowseBooks={() => setStudentTab('catalog')}
              />
            )}

            {studentTab === 'fines' && (
              <StudentFines fines={studentFines} settings={librarySettings} />
            )}

            {studentTab === 'profile' && <StudentProfile />}
          </main>
        </div>
      ) : role === 'admin' ? (
        // ADMIN / TEACHER PORTAL VIEW
        <div className="flex-1 flex flex-col">
          <AdminNavbar
            activeTab={adminTab}
            setActiveTab={setAdminTab}
            pendingVerificationsCount={students.filter((s) => !s.verified).length}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
            {adminTab === 'dashboard' && (
              <AdminDashboard
                books={books}
                students={students}
                issues={allIssues}
                fines={allFines}
                activityLogs={activityLogs}
                onNavigate={setAdminTab}
              />
            )}

            {adminTab === 'issue-return' && (
              <AdminIssueReturn
                books={books}
                students={students}
                issues={allIssues}
                settings={librarySettings}
                onRefresh={refreshData}
              />
            )}

            {adminTab === 'books' && (
              <AdminBookManagement
                books={books}
                onRefresh={refreshData}
                onViewDetails={(b) => setSelectedBookForModal(b)}
              />
            )}

            {adminTab === 'students' && (
              <AdminStudentManagement
                students={students}
                issues={allIssues}
                fines={allFines}
                onRefresh={refreshData}
              />
            )}

            {adminTab === 'reservations' && (
              <AdminReservations
                reservations={allReservations}
                books={books}
                students={students}
                onRefresh={refreshData}
              />
            )}

            {adminTab === 'fines' && <AdminFines fines={allFines} students={students} onRefresh={refreshData} />}

            {adminTab === 'reports' && (
              <AdminReports
                books={books}
                students={students}
                issues={allIssues}
                fines={allFines}
              />
            )}

            {adminTab === 'settings' && (
              <AdminSettings
                settings={librarySettings}
                announcements={announcements}
                onRefresh={refreshData}
              />
            )}
          </main>
        </div>
      ) : (
        // PUBLIC / LANDING VIEW
        <div className="flex-1 flex flex-col">
          {isPublicCatalogView ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
              <button
                onClick={() => setIsPublicCatalogView(false)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home Page
              </button>

              <BookCatalog
                books={books}
                onSelectBook={(book) => setSelectedBookForModal(book)}
              />
            </div>
          ) : (
            <LandingPage
              onOpenStudentLogin={handleOpenStudentLogin}
              onOpenStudentSignup={handleOpenStudentSignup}
              onOpenAdminLogin={handleOpenAdminLogin}
              onSearchBooks={() => setIsPublicCatalogView(true)}
              onSelectBook={(book) => setSelectedBookForModal(book)}
            />
          )}
        </div>
      )}

      {/* SMS OTP Notification Banner */}
      <SMSNotificationBanner />

      {/* Global Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        initialRole={loginInitialRole}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToSignUp={() => setSignupModalOpen(true)}
      />

      <StudentVerificationModal
        isOpen={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        onVerificationSuccess={() => {
          setSignupModalOpen(false);
          refreshData();
        }}
      />

      <BookDetailsModal
        book={selectedBookForModal}
        isOpen={!!selectedBookForModal}
        onClose={() => setSelectedBookForModal(null)}
        onOpenStudentLogin={handleOpenStudentLogin}
      />

      {role === 'student' && (
        <StudentNotificationsModal
          isOpen={notificationsModalOpen}
          onClose={() => setNotificationsModalOpen(false)}
          notifications={studentNotifications}
          onRefresh={refreshData}
        />
      )}

      {/* Student E-Book Reader Modal */}
      <StudentEbookReaderModal
        book={activeStudentEbook}
        isOpen={Boolean(activeStudentEbook)}
        onClose={() => setActiveStudentEbook(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
