import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  ShieldCheck,
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  KeyRound,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { sendMobileOTP } from '../../lib/otpService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'student' | 'admin';
  onSwitchToSignUp: () => void;
}

export const LoginModal: React.FC<Props> = ({ isOpen, onClose, initialRole = 'student', onSwitchToSignUp }) => {
  const { loginStudent, loginStudentWithOTP, loginAdmin, sendResetEmail } = useAuth();

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>(initialRole);
  const [studentAuthMode, setStudentAuthMode] = useState<'password' | 'otp'>('password');
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Form states - Empty by default (no auto-fill)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpDispatched, setOtpDispatched] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reset all inputs whenever modal opens or role changes so nothing is pre-filled
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialRole);
      setEmail('');
      setPassword('');
      setMobileNumber('');
      setOtpCode('');
      setOtpDispatched(false);
      setErrorMessage('');
      setSuccessMessage('');
      setIsForgotPassword(false);
    }
  }, [isOpen, initialRole]);

  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setInterval(() => setOtpCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [otpCooldown]);

  if (!isOpen) return null;

  const handleTabChange = (tab: 'student' | 'admin') => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
    setIsForgotPassword(false);
    setEmail('');
    setPassword('');
    setMobileNumber('');
    setOtpCode('');
    setOtpDispatched(false);
  };

  const handleSendOtp = () => {
    setErrorMessage('');
    setSuccessMessage('');
    const cleanDigits = mobileNumber.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      setErrorMessage('Kripya apna 10-digit registered mobile number dalein.');
      return;
    }

    try {
      const res = sendMobileOTP(cleanDigits, 'login');
      setOtpDispatched(true);
      setOtpCooldown(60);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP dispatch failed.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (activeTab === 'student') {
        if (studentAuthMode === 'otp') {
          if (!otpDispatched) {
            setErrorMessage('Kripya pehle "Send OTP" button dabayein.');
            setLoading(false);
            return;
          }
          await loginStudentWithOTP(mobileNumber, otpCode);
        } else {
          await loginStudent(email, password);
        }
      } else {
        await loginAdmin(email, password);
      }

      onClose();
    } catch (err: any) {
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        if (activeTab === 'admin') {
          setErrorMessage(
            'Invalid credentials for administrator. Please verify your email and password.'
          );
        } else {
          setErrorMessage(
            'Invalid credentials or student record not found. Kripya pehle "Student Registration" form bharein.'
          );
        }
      } else {
        setErrorMessage(err.message || 'Login failed. Please verify credentials or contact the library.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your registered college email address.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await sendResetEmail(email);
      setSuccessMessage('Password reset instructions sent to your email.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-500/20 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Tabs - Royal Navy & Gold */}
        <div className="bg-[#071129] text-white p-5 pb-0 border-b border-amber-500/25">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0c1a40] border border-amber-400/70 text-amber-300 flex items-center justify-center font-black text-xs">
                VVUC
              </div>
              <div>
                <h2 className="text-base font-black text-white">Portal Access</h2>
                <p className="text-xs text-amber-300/80">Vidya Vikas Universal College</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('student')}
              className={`pb-3 pt-2 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'student'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student Portal
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`pb-3 pt-2 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'admin'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Chief Administrator
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
              <p className="font-semibold leading-relaxed">{errorMessage}</p>
              {activeTab === 'student' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToSignUp();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition-all"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Fill Student Registration Form Now →
                </button>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              {successMessage}
            </div>
          )}

          {!isForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              {activeTab === 'student' && (
                <>
                  <div className="p-3 rounded-xl bg-blue-50/90 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
                    <GraduationCap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-950 block">Student Registration Policy</span>
                      <span className="text-blue-800 text-[11px] block mt-0.5">
                        Student dashboard sirf registered students ke liye khulega. Agar abhi tak account nahi banaya hai to pehle register karein.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSwitchToSignUp();
                        }}
                        className="text-xs font-bold text-blue-900 underline hover:text-blue-700 mt-1 inline-block"
                      >
                        Pehle Student Registration Karein (Click Here) →
                      </button>
                    </div>
                  </div>

                  {/* Student Login Method Switcher */}
                  <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setStudentAuthMode('password');
                        setErrorMessage('');
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        studentAuthMode === 'password'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Password Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStudentAuthMode('otp');
                        setErrorMessage('');
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        studentAuthMode === 'otp'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      Mobile OTP Login
                    </button>
                  </div>
                </>
              )}

              {activeTab === 'admin' && (
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-white block">Chief Administrator Portal</span>
                    <span className="text-slate-300 text-[11px]">
                      Enter authorized admin credentials to access library management controls.
                    </span>
                  </div>
                </div>
              )}

              {/* Form Fields: Student OTP vs Password */}
              {activeTab === 'student' && studentAuthMode === 'otp' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered 10-Digit Mobile Number *
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500 select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={mobileNumber}
                          onChange={(e) => {
                            setMobileNumber(e.target.value.replace(/\D/g, ''));
                            if (otpDispatched) setOtpDispatched(false);
                          }}
                          placeholder="9876543210"
                          className="w-full pl-11 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#071129] font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpCooldown > 0 || mobileNumber.length !== 10}
                        className="px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shrink-0 shadow-xs"
                      >
                        {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : otpDispatched ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  {otpDispatched && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 animate-in fade-in duration-200 space-y-2">
                      <div className="flex items-center justify-between text-xs text-blue-900 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                          Enter 6-Digit OTP Received:
                        </span>
                        <span className="text-[11px] text-blue-700 font-mono">Mobile: +91 {mobileNumber}</span>
                      </div>

                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 123456"
                        className="w-full px-3 py-2 text-center font-mono tracking-widest text-lg font-black rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {activeTab === 'student' ? 'Registered Student Email or Student ID' : 'Authorized Chief Admin Email'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          activeTab === 'student' ? 'e.g. rahul@gmail.com or VVUC-2024-001' : 'e.g. admin@vvuc.edu.in'
                        }
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#071129] focus:border-transparent font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-[11px] text-[#071129] font-semibold hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#071129] focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 px-4 rounded-xl font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    activeTab === 'student'
                      ? 'bg-[#071129] text-amber-300 hover:bg-[#0c1c46]'
                      : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-slate-950 hover:brightness-105'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating with Firebase...
                    </>
                  ) : (
                    <>
                      Login to {activeTab === 'student' ? 'Student Portal' : 'Admin Dashboard'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {activeTab === 'student' && (
                <p className="text-center text-xs text-slate-500 pt-2">
                  New student?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToSignUp();
                    }}
                    className="font-bold text-[#071129] hover:text-amber-700 hover:underline"
                  >
                    Verify & Create Account
                  </button>
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Reset Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered college email address to receive recovery instructions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.name@vidyavikas.edu"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-1/3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-xl flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
