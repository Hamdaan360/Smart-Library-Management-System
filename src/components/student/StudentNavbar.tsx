import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  LayoutDashboard,
  Library,
  BookMarked,
  History,
  Receipt,
  BookmarkCheck,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { LibraryNotification } from '../../types';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: LibraryNotification[];
  onOpenNotifications: () => void;
}

export const StudentNavbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  notifications,
  onOpenNotifications,
}) => {
  const { studentProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: 'Search Books', icon: Library },
    { id: 'ebooks', label: 'E-Books (PDFs)', icon: FileText },
    { id: 'my-books', label: 'My Books', icon: BookMarked },
    { id: 'history', label: 'Borrowing History', icon: History },
    { id: 'reservations', label: 'Reservations', icon: BookmarkCheck },
    { id: 'fines', label: 'My Fines', icon: Receipt },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <header className="bg-[#071129] border-b border-amber-500/25 sticky top-0 z-30 shadow-lg text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0c1a40] via-[#10245a] to-[#081330] text-amber-300 flex items-center justify-center font-black shadow-xs border-2 border-amber-400/80 relative">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span className="absolute -bottom-1 text-[7px] font-black uppercase tracking-tighter bg-amber-500 text-slate-950 px-0.5 rounded-xs leading-none">
                  VVUC
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block leading-none">
                  Vidya Vikas Universal College
                </span>
                <span className="font-extrabold text-xs sm:text-sm text-white block">Student Library Portal</span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-amber-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Profile Badge */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-amber-300 hover:text-amber-200 hover:bg-white/10 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Student Info chip */}
            <div
              onClick={() => setActiveTab('profile')}
              className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-[#0c1b44] border border-amber-400/30 cursor-pointer hover:border-amber-400/60 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                {studentProfile?.name?.charAt(0) || 'S'}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                  {studentProfile?.name}
                </p>
                <p className="text-[10px] font-mono text-amber-300 leading-none">
                  {studentProfile?.studentId}
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors"
              title="Logout from Student Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-amber-300 hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#071129] border-b border-amber-500/30 px-4 py-3 space-y-1">
          <div className="p-3 mb-2 rounded-xl bg-[#0c1b44] border border-amber-400/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm">
              {studentProfile?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <p className="font-bold text-xs text-white">{studentProfile?.name}</p>
              <p className="text-[11px] font-mono text-amber-300">
                {studentProfile?.studentId} • Roll: {studentProfile?.rollNumber}
              </p>
              <p className="text-[10px] text-slate-300">
                {studentProfile?.stream} ({studentProfile?.classYear} - Div {studentProfile?.division})
              </p>
            </div>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
