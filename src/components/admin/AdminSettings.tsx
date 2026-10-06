import React, { useState, useEffect } from 'react';
import { LibrarySettings, Announcement, AdminUser } from '../../types';
import {
  updateLibrarySettings,
  createAnnouncement,
  clearAllBooksAndStudents,
  getAdmins,
  addAdminStaff,
  deleteAdminStaff,
} from '../../lib/libraryService';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Building,
  BellRing,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Plus,
  Lock,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  UserPlus,
  Users,
  Shield,
} from 'lucide-react';

interface Props {
  settings: LibrarySettings | null;
  announcements: Announcement[];
  onRefresh: () => void;
}

export const AdminSettings: React.FC<Props> = ({ settings, announcements, onRefresh }) => {
  const { adminProfile, adminPassword, changeAdminPassword } = useAuth();

  const [formData, setFormData] = useState<LibrarySettings>(
    settings || {
      collegeName: 'Vidya Vikas Universal College',
      libraryName: 'VVUC Central Knowledge & Learning Resource Center',
      address: '1st Floor, Vidya Vikas Universal College, Chincholi Bunder, Malad (West), Mumbai - 400064',
      maxBooksPerStudent: 3,
      issuePeriodDays: 14,
      finePerDay: 5,
      gracePeriodDays: 2,
      maxFine: 200,
      openingHours: 'Mon – Sat: 8:00 AM – 5:00 PM',
      email: 'v.v.u.c.library@gmail.com',
      contact: '',
    }
  );

  // Admin Staff Management State
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'admin' | 'librarian' | 'superadmin'>('admin');
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffFeedback, setStaffFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const list = await getAdmins();
      setAdminsList(list);
    } catch (err) {
      console.warn('Failed to load admin list:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim()) {
      setStaffFeedback({ type: 'error', text: 'Name and Email are required.' });
      return;
    }
    const cleanEmail = staffEmail.trim().toLowerCase();
    if (adminsList.some((a) => (a.email || '').toLowerCase() === cleanEmail)) {
      setStaffFeedback({ type: 'error', text: 'An administration staff member with this email already exists.' });
      return;
    }

    setStaffSaving(true);
    setStaffFeedback(null);
    try {
      await addAdminStaff(
        {
          name: staffName.trim(),
          email: cleanEmail,
          password: staffPassword.trim() || undefined,
          role: staffRole,
        },
        { uid: adminProfile?.uid || 'admin-super', name: adminProfile?.name || 'Chief Administrator' }
      );
      setStaffFeedback({
        type: 'success',
        text: `Chief Administration Staff "${staffName.trim()}" added successfully! They can now log in using ${cleanEmail}.`,
      });
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setIsAddStaffOpen(false);
      await loadAdmins();
    } catch (err: any) {
      setStaffFeedback({ type: 'error', text: err.message || 'Failed to add admin staff.' });
    } finally {
      setStaffSaving(false);
    }
  };

  const handleDeleteStaff = async (adminId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from Chief Administration Staff?`)) return;
    try {
      await deleteAdminStaff(adminId, {
        uid: adminProfile?.uid || 'admin-super',
        name: adminProfile?.name || 'Chief Administrator',
      });
      setStaffFeedback({ type: 'success', text: `Administration staff member "${name}" removed.` });
      await loadAdmins();
    } catch (err: any) {
      setStaffFeedback({ type: 'error', text: err.message || 'Failed to remove staff member.' });
    }
  };

  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'high' | 'urgent'>('normal');

  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [savingSettings, setSavingSettings] = useState(false);
  const [publishingAnn, setPublishingAnn] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clear data confirmation modal
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setPasswordFeedback({ type: 'error', text: 'Please enter a valid password.' });
      return;
    }
    if (newPassword.trim().length < 6) {
      setPasswordFeedback({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setPasswordUpdating(true);
    setPasswordFeedback(null);
    try {
      await changeAdminPassword(newPassword.trim());
      setPasswordFeedback({
        type: 'success',
        text: `Administrator password updated successfully to "${newPassword.trim()}".`,
      });
      setNewPassword('');
    } catch (err: any) {
      setPasswordFeedback({ type: 'error', text: err.message || 'Failed to update administrator password.' });
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setFeedback(null);
    try {
      await updateLibrarySettings(formData, adminProfile?.name || 'Chief Librarian');
      setFeedback({ type: 'success', text: 'Library configuration & policies updated successfully!' });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    setPublishingAnn(true);
    setFeedback(null);
    try {
      await createAnnouncement({
        title: annTitle.trim(),
        message: annMessage.trim(),
        priority: annPriority,
        createdBy: adminProfile?.name || 'Chief Librarian',
      });

      setFeedback({ type: 'success', text: 'New library announcement broadcasted to all students!' });
      setAnnTitle('');
      setAnnMessage('');
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to publish notice.' });
    } finally {
      setPublishingAnn(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">Library Configuration & Rules</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Vidya Vikas Universal College (VVUC) • Single Administrator Desk: hamdaanai360@gmail.com
        </p>
      </div>

      {/* Single Admin Security Card - Royal Navy & Gold */}
      <div className="bg-[#071129] text-white p-5 rounded-2xl border-2 border-amber-500/30 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black flex items-center justify-center text-base shadow-sm">
              H
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">Hamdaan</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  Single Super Administrator
                </span>
              </div>
              <p className="text-xs text-amber-300/90 font-mono">hamdaanai360@gmail.com</p>
            </div>
          </div>
          <div className="text-xs text-slate-300 sm:text-right">
            <span className="text-[11px] font-bold text-amber-400 block">RBAC Security Policy Active</span>
            <span>Only this administrator holds issuance, catalog modification, and student clearance rights</span>
          </div>
        </div>

        {/* Password Credentials & Update Box */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Active Admin Password:
              </span>
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showCurrentPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
              <code className="font-mono text-sm font-bold text-amber-300">
                {showCurrentPassword ? adminPassword : '••••••••••••'}
              </code>
              {adminPassword !== 'Hamdaan07' && (
                <button
                  type="button"
                  onClick={() => changeAdminPassword('Hamdaan07')}
                  className="text-[10px] uppercase font-bold text-slate-400 hover:text-amber-300 underline"
                >
                  Reset to Hamdaan07
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Login at portal with: <strong className="text-white">hamdaanai360@gmail.com</strong> /{' '}
              <strong className="text-amber-300">{adminPassword}</strong>
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" /> Change Administrator Password:
            </span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (e.g. Hamdaan07)"
                  className="w-full pl-8 pr-2 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={passwordUpdating || !newPassword.trim()}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-105 text-slate-950 font-black text-xs shrink-0 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {passwordUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update'}
              </button>
            </div>
            {passwordFeedback && (
              <p
                className={`text-[11px] font-semibold ${
                  passwordFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {passwordFeedback.text}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Chief Administration Staff Management Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Chief Administration Staff & Access Control</h3>
              <p className="text-[11px] text-slate-500">
                Authorized staff members with email & password who can log in to the admin portal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddStaffOpen(!isAddStaffOpen)}
            className="px-3.5 py-2 rounded-xl bg-[#071129] hover:bg-[#0c1c46] text-amber-300 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {isAddStaffOpen ? 'Cancel' : '+ Add Chief Admin Staff'}
          </button>
        </div>

        {staffFeedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              staffFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {staffFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <p className="font-semibold">{staffFeedback.text}</p>
          </div>
        )}

        {/* Add Staff Form */}
        {isAddStaffOpen && (
          <form
            onSubmit={handleAddStaff}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150"
          >
            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-900" />
              Register New Chief Administration Staff Member:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Prof. Rajesh Sharma"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="e.g. rajesh.sharma@vvuc.edu"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Login Password *</label>
                <input
                  type="text"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="e.g. Staff@VVUC2024"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Staff Role</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 bg-white font-semibold text-slate-800"
                >
                  <option value="admin">Chief Administrator</option>
                  <option value="librarian">Assistant Librarian</option>
                  <option value="superadmin">Co-Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-slate-600 bg-slate-200 hover:bg-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={staffSaving}
                className="px-4 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                {staffSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Add Administration Staff
              </button>
            </div>
          </form>
        )}

        {/* Administration Staff Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="p-3">Staff Member</th>
                <th className="p-3">Login Email</th>
                <th className="p-3">Designation / Role</th>
                <th className="p-3">Login Method</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Primary Superadmin */}
              <tr className="bg-amber-50/40">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">
                      H
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">Hamdaan</span>
                      <span className="text-[10px] text-amber-800 font-semibold">Chief Administrator (Founder)</span>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono text-slate-700 font-medium">hamdaanai360@gmail.com</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-950 border border-amber-300">
                    Single Superadmin
                  </span>
                </td>
                <td className="p-3 text-[11px] text-slate-600">Password: <strong className="font-mono text-slate-900">{adminPassword}</strong></td>
                <td className="p-3 text-right">
                  <span className="text-[11px] text-slate-400 font-medium italic">Primary Root (Protected)</span>
                </td>
              </tr>

              {/* Added Staff Members */}
              {adminsList
                .filter((a) => (a.email || '').toLowerCase() !== 'hamdaanai360@gmail.com')
                .map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{admin.name}</td>
                    <td className="p-3 font-mono text-slate-700">{admin.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200 uppercase">
                        {admin.role === 'librarian' ? 'Assistant Librarian' : admin.role === 'superadmin' ? 'Co-Super Admin' : 'Chief Administrator'}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-600 font-mono">
                      Password: {admin.password ? `•••••••• (${admin.password})` : `System Default (${adminPassword})`}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(admin.id, admin.name)}
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}

              {adminsList.filter((a) => (a.email || '').toLowerCase() !== 'hamdaanai360@gmail.com').length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400 text-xs">
                    No additional administration staff added yet. Click "+ Add Chief Admin Staff" to authorize other librarians or administrative faculty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circulation Parameters Form */}
        <form
          onSubmit={handleSaveSettings}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-900" />
            <h3 className="font-bold text-sm text-slate-900">Institutional & Circulation Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">College Name</label>
              <input
                type="text"
                required
                value={formData.collegeName}
                onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Library Name / Facility</label>
              <input
                type="text"
                required
                value={formData.libraryName}
                onChange={(e) => setFormData({ ...formData, libraryName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Physical Campus Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Books Allowed Per Student</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.maxBooksPerStudent}
                onChange={(e) => setFormData({ ...formData, maxBooksPerStudent: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Loan Period (Days)</label>
              <input
                type="number"
                min="1"
                max="60"
                required
                value={formData.issuePeriodDays}
                onChange={(e) => setFormData({ ...formData, issuePeriodDays: parseInt(e.target.value) || 14 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Daily Overdue Fine (INR / Day)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.finePerDay}
                onChange={(e) => setFormData({ ...formData, finePerDay: parseInt(e.target.value) || 5 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grace Period (Days Before Fine)</label>
              <input
                type="number"
                min="0"
                max="10"
                required
                value={formData.gracePeriodDays}
                onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) || 2 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Maximum Fine Cap (INR / Book)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.maxFine}
                onChange={(e) => setFormData({ ...formData, maxFine: parseInt(e.target.value) || 200 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Opening Hours</label>
              <input
                type="text"
                required
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Contact Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save Configuration Settings
            </button>
          </div>
        </form>

        {/* Broadcast Announcement Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <BellRing className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Broadcast Campus Notice</h3>
          </div>

          <form onSubmit={handlePublishAnnouncement} className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notice Title *</label>
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="e.g. Extended Library Hours During Final Exams"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority Tag</label>
              <select
                value={annPriority}
                onChange={(e) => setAnnPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="normal">Normal Information</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Campus Notice</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Announcement Message *</label>
              <textarea
                rows={4}
                required
                value={annMessage}
                onChange={(e) => setAnnMessage(e.target.value)}
                placeholder="Write message visible on landing page & student portals..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={publishingAnn}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {publishingAnn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Publish Notice to Students
            </button>
          </form>

          {/* Existing announcements preview */}
          <div className="pt-3 border-t border-slate-200">
            <h4 className="font-bold text-[11px] text-slate-400 uppercase mb-2">Recent Broadcasts</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {announcements.map((a) => (
                <div key={a.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-slate-800 truncate">{a.title}</span>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">{a.createdDate}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Database Maintenance & Clear Data Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-700" />
              <h3 className="font-bold text-sm text-slate-900">Database Initialization & Fresh Start</h3>
            </div>
            <p className="text-slate-500 text-xs">
              Clear all pre-existing books and student records to start fresh with your own custom college data and enroll real students.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shrink-0 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Clear Books & Students Data
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-700 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Clear All Pre-Existing Data?</h3>
                <p className="text-xs text-slate-500">Reset books, students, and circulation records</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              This will wipe all existing sample books, student roster members, and past circulation transactions.
              Your admin login credentials and college settings will remain safe.
            </p>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                disabled={isClearingData}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingData}
                onClick={async () => {
                  setIsClearingData(true);
                  try {
                    const res = await clearAllBooksAndStudents({
                      uid: adminProfile?.uid || 'admin-hamdaan',
                      name: adminProfile?.name || 'Hamdaan (Chief Administrator)',
                    });
                    setFeedback({
                      type: 'success',
                      text: `Successfully wiped ${res.deletedBooks} books and ${res.deletedStudents} students. The library is ready for fresh data!`,
                    });
                    setIsClearModalOpen(false);
                    onRefresh();
                  } catch (err: any) {
                    setFeedback({ type: 'error', text: err.message || 'Failed to clear data.' });
                  } finally {
                    setIsClearingData(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isClearingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
