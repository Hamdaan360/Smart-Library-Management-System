import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, GraduationCap, RefreshCw, Key, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { seedFreshDemoData } from '../../lib/libraryService';

export const DemoBanner: React.FC = () => {
  const { role, loginDemoAdmin, loginDemoStudent, logout } = useAuth();
  const [showCredentials, setShowCredentials] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  const handleSeedData = async () => {
    if (!confirm('Re-seed realistic college library books, official student roster, and announcements in Firestore?')) return;
    setSeeding(true);
    setSeedMsg('');
    try {
      await seedFreshDemoData();
      setSeedMsg('Firestore database populated successfully!');
      setTimeout(() => setSeedMsg(''), 4000);
      window.location.reload();
    } catch (e: any) {
      setSeedMsg('Error: ' + e.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <aside aria-label="Demo Testing Bar" className="bg-slate-900 text-slate-200 text-xs border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-600 text-white">
            VVUC Demo Bar
          </span>
          <span className="hidden sm:inline text-slate-300">
            Active Mode: <strong className="text-white capitalize">{role ? `${role}` : 'Guest / Visitor'}</strong>
          </span>
          {seedMsg && <span className="text-emerald-400 font-medium ml-2">{seedMsg}</span>}
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {!role && (
            <button
              onClick={() => loginDemoAdmin()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium border border-amber-500/30 transition-colors"
              title="1-Click Login as Chief Librarian (Hamdaan)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Quick Admin Login
            </button>
          )}

          {role && (
            <button
              onClick={() => logout()}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium border border-rose-500/30 transition-colors"
            >
              Sign Out ({role})
            </button>
          )}

          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            Admin Credentials
            {showCredentials ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {showCredentials && (
        <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 text-xs">
          <div className="max-w-7xl mx-auto">
            <div className="bg-slate-900 p-3 rounded border border-slate-800">
              <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Chief Administrator Credentials:
              </p>
              <p className="text-slate-400">
                Email: <span className="text-slate-200 font-mono">hamdaanai360@gmail.com</span> | Password:{' '}
                <span className="text-amber-300 font-mono font-bold">Hamdaan07</span> (or click &quot;Quick Admin Login&quot;)
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
