import React, { useEffect, useState } from 'react';
import { MessageSquare, ShieldCheck, X, Copy, Check, Sparkles } from 'lucide-react';
import { SMSNotificationEventDetail } from '../../lib/otpService';

export const SMSNotificationBanner: React.FC = () => {
  const [activeSMS, setActiveSMS] = useState<SMSNotificationEventDetail | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleSMS = (e: CustomEvent<SMSNotificationEventDetail>) => {
      setActiveSMS(e.detail);
      setCopied(false);
    };

    window.addEventListener('vvuc-sms-received' as any, handleSMS as any);
    return () => {
      window.removeEventListener('vvuc-sms-received' as any, handleSMS as any);
    };
  }, []);

  if (!activeSMS) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSMS.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#071129] text-white rounded-2xl shadow-2xl border-2 border-amber-400 p-4 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2 border-b border-amber-400/20 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/40">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wide text-amber-300">VVUC-LIBRARY</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> Official SMS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">To: {activeSMS.formattedMobile}</p>
            </div>
          </div>

          <button
            onClick={() => setActiveSMS(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <p className="text-slate-200 leading-relaxed">
            Vidya Vikas Universal College Library verification code is{' '}
            <span className="font-mono text-base font-black text-amber-300 px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30">
              {activeSMS.code}
            </span>
            . Valid for 5 minutes.
          </p>

          <div className="pt-1 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">{activeSMS.timestamp}</span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-800" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
