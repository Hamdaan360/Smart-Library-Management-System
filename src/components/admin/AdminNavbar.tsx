import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  LayoutDashboard,
  BookOpen,
  Users,
  Repeat,
  BookmarkCheck,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingVerificationsCount: number;
}

export const AdminNavbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  pendingVerificationsCount,
}) => {
  const { adminProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'issue-return', label: 'Issue / Return', icon: Repeat },
    { id: 'books', label: 'Books', icon: BookOpen },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
    },
    { id: 'reservations', label: 'Reservations', icon: BookmarkCheck },
    { id: 'fines', label: 'Fines', icon: Receipt },
    { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-[#060e24] border-b border-amber-500/25 text-white sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0c1a40] via-[#10245a] to-[#081330] text-amber-300 flex items-center justify-center font-black shadow-xs border-2 border-amber-400/80 relative">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span className="absolute -bottom-1 text-[7px] font-black uppercase tracking-tighter bg-amber-500 text-slate-950 px-0.5 rounded-xs leading-none">
                  VVUC
                </span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block leading-none">
                  Vidya Vikas Universal College
                </span>
                <span className="font-extrabold text-xs sm:text-sm text-white block">Chief Administrator Portal</span>
              </div>
            </button>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-300 hover:text-amber-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-[#0c1b44] border border-amber-400/30 text-xs">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                H
              </div>
              <div className="text-left">
                <p className="font-bold text-white leading-tight">
                  {adminProfile?.name || 'Hamdaan'}
                </p>
                <p className="text-[10px] font-mono text-amber-300 leading-none">Super Administrator</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              title="Logout from Admin Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-amber-300 hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#060e24] border-b border-amber-500/30 px-4 py-3 space-y-1">
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                    {item.badge} pending
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
