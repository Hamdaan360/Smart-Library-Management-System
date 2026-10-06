import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { STUDENT_STREAMS } from '../../types';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  GraduationCap,
  ArrowRight,
  Loader2,
  Smartphone,
  KeyRound,
  Check,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { sendMobileOTP, verifyMobileOTP } from '../../lib/otpService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onVerificationSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const StudentVerificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  onVerificationSuccess,
  onSwitchToLogin,
}) => {
  const { signupStudent } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    rollNumber: '',
    stream: STUDENT_STREAMS[0] || 'FYJC Science',
    classYear: 'FYJC',
    division: 'A',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Mobile OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpStatusMsg, setOtpStatusMsg] = useState('');
  const [otpErrorMsg, setOtpErrorMsg] = useState('');

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setInterval(() => setOtpCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [otpCooldown]);

  if (!isOpen) return null;

  const classYears = ['FYJC', 'SYJC', 'FY', 'SY', 'TY'];
  const divisions = ['A', 'B', 'C', 'D'];

  const handleSendOtp = () => {
    setOtpErrorMsg('');
    setOtpStatusMsg('');
    const digits = formData.mobile.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
      setOtpErrorMsg('Kripya pehle 10-digit mobile number enter karein.');
      return;
    }
    try {
      const res = sendMobileOTP(digits, 'registration');
      setOtpSent(true);
      setOtpCooldown(60);
      setOtpStatusMsg(res.message);
    } catch (err: any) {
      setOtpErrorMsg(err.message || 'OTP dispatch error');
    }
  };

  const handleVerifyOtp = () => {
    setOtpErrorMsg('');
    setOtpStatusMsg('');
    const digits = formData.mobile.replace(/\D/g, '').slice(-10);
    const res = verifyMobileOTP(digits, otpInput);
    if (res.success) {
      setIsPhoneVerified(true);
      setOtpStatusMsg('✓ Mobile number successfully verified with OTP!');
    } else {
      setOtpErrorMsg(res.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isPhoneVerified) {
      setErrorMessage(
        'Student mobile number verify nahi hua hai! Kripya "Send OTP" button dabakar 6-digit OTP verify karein.'
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await signupStudent({
        name: formData.name,
        studentId: formData.studentId,
        rollNumber: formData.rollNumber,
        stream: formData.stream,
        classYear: formData.classYear,
        division: formData.division,
        email: formData.email,
        mobile: formData.mobile,
        pass: formData.password,
        isPhoneVerified: true,
      });

      setSuccessMessage('Student verified & registered with Firebase! Opening your Student Dashboard...');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onVerificationSuccess) onVerificationSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      // Must display exact required error message if verification fails
      setErrorMessage(
        err.message ||
          'Student details could not be verified. Please check your information or contact the library administrator.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-amber-500/20 animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Royal Navy & Gold */}
        <div className="px-6 py-5 bg-[#071129] border-b border-amber-500/30 text-white flex items-start justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0c1a40] flex items-center justify-center border-2 border-amber-400/80 shadow-xs">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">Student Registration & Verification</h2>
              <p className="text-xs text-amber-300/80 font-medium">
                Vidya Vikas Universal College (VVUC) • Official Identity Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Identity Verification Alert</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="font-semibold text-xs">{successMessage}</p>
            </div>
          )}

          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. College Record Verification (Must Match Official Records)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name (as per College ID) *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student ID (College Enrollment No.) *
              </label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="e.g. VVUC-2024-001"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="e.g. 101"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stream / Course *
              </label>
              <select
                value={formData.stream}
                onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                {STUDENT_STREAMS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class / Year *
              </label>
              <select
                value={formData.classYear}
                onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                {classYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Division *
              </label>
              <select
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                {divisions.map((d) => (
                  <option key={d} value={d}>
                    Division {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-b border-slate-200 pb-2 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Account Credentials & Contact Info
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@vidyavikas.edu"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Mobile Number *
                </label>
                {isPhoneVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    OTP Verified
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-700 font-medium">OTP Verification Required</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    disabled={isPhoneVerified}
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, mobile: val });
                      if (isPhoneVerified) setIsPhoneVerified(false);
                    }}
                    placeholder="9876543210"
                    className={`w-full pl-11 pr-3 py-2 text-sm rounded-lg border ${
                      isPhoneVerified
                        ? 'border-emerald-400 bg-emerald-50/50 text-emerald-950'
                        : 'border-slate-300 focus:ring-2 focus:ring-blue-600'
                    } focus:outline-none`}
                  />
                </div>
                {!isPhoneVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpCooldown > 0 || formData.mobile.length !== 10}
                    className="px-3 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors whitespace-nowrap shadow-xs"
                  >
                    {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                )}
              </div>

              {/* OTP Input Card when OTP is dispatched */}
              {otpSent && !isPhoneVerified && (
                <div className="mt-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 animate-in fade-in duration-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-900 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                      Enter 6-Digit SMS Code:
                    </span>
                    <span className="text-[11px] text-blue-700 font-mono">OTP Sent to +91 {formData.mobile}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="flex-1 px-3 py-1.5 text-center font-mono tracking-widest text-base font-bold rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpInput.length !== 6}
                      className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Verify OTP
                    </button>
                  </div>

                  {otpErrorMsg && (
                    <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {otpErrorMsg}
                    </p>
                  )}
                  {otpStatusMsg && (
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      {otpStatusMsg}
                    </p>
                  )}
                </div>
              )}

              {isPhoneVerified && (
                <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />
                  Mobile number +91 {formData.mobile} is verified with OTP!
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Create Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Repeat password"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:brightness-105 text-slate-950 font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying College Records with Database...
                </>
              ) : (
                <>
                  Verify Identity & Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-slate-500 pt-1">
            Already verified your account?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onSwitchToLogin) onSwitchToLogin();
              }}
              className="font-bold text-[#071129] hover:text-amber-700 hover:underline"
            >
              Student Login here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
