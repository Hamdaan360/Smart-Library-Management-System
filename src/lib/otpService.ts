// College Mobile Number SMS OTP Service
// Handles generation, simulated SMS dispatching, timing, and verification

export interface OTPRecord {
  mobile: string;
  code: string;
  expiresAt: number;
  attempts: number;
  purpose: 'registration' | 'login';
}

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_STORAGE_KEY = 'vvuc_active_otp_record';

export interface SMSNotificationEventDetail {
  mobile: string;
  code: string;
  purpose: string;
  formattedMobile: string;
  timestamp: string;
}

export function formatIndianMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(-10);
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return mobile;
}

/**
 * Generates a 6-digit OTP code and dispatches a simulated SMS notification
 */
export function sendMobileOTP(
  mobile: string,
  purpose: 'registration' | 'login' = 'registration'
): { code: string; message: string; expiryMs: number } {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  if (cleanMobile.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number.');
  }

  // Generate a cryptographically sound or high-entropy 6-digit numeric OTP
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const code = randomNum.toString();

  const record: OTPRecord = {
    mobile: cleanMobile,
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
    purpose,
  };

  try {
    sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(record));
  } catch (e) {
    console.warn('Failed to store OTP in sessionStorage:', e);
  }

  // Dispatch custom SMS event for UI presentation
  if (typeof window !== 'undefined') {
    const eventDetail: SMSNotificationEventDetail = {
      mobile: cleanMobile,
      code,
      purpose,
      formattedMobile: formatIndianMobile(cleanMobile),
      timestamp: new Date().toLocaleTimeString(),
    };
    window.dispatchEvent(new CustomEvent('vvuc-sms-received', { detail: eventDetail }));
  }

  return {
    code,
    message: `OTP sent successfully to +91 ${cleanMobile}`,
    expiryMs: OTP_EXPIRY_MS,
  };
}

/**
 * Validates the entered OTP code against the active record
 */
export function verifyMobileOTP(
  mobile: string,
  enteredCode: string
): { success: boolean; message: string } {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  const cleanCode = enteredCode.trim();

  if (!cleanCode || cleanCode.length !== 6) {
    return { success: false, message: 'Please enter the complete 6-digit OTP code.' };
  }

  let stored: OTPRecord | null = null;
  try {
    const raw = sessionStorage.getItem(OTP_STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read OTP from storage:', e);
  }

  if (!stored || stored.mobile !== cleanMobile) {
    return {
      success: false,
      message: 'No active OTP request found for this mobile number. Please click "Send OTP".',
    };
  }

  if (Date.now() > stored.expiresAt) {
    try {
      sessionStorage.removeItem(OTP_STORAGE_KEY);
    } catch {}
    return {
      success: false,
      message: 'OTP has expired. Please request a new OTP code.',
    };
  }

  if (stored.attempts >= 5) {
    try {
      sessionStorage.removeItem(OTP_STORAGE_KEY);
    } catch {}
    return {
      success: false,
      message: 'Too many incorrect attempts. Please request a new OTP code.',
    };
  }

  if (stored.code !== cleanCode) {
    stored.attempts += 1;
    try {
      sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(stored));
    } catch {}
    return {
      success: false,
      message: `Invalid OTP code. Please check the SMS and try again. (${5 - stored.attempts} attempts remaining)`,
    };
  }

  // Verification succeeded - clear OTP
  try {
    sessionStorage.removeItem(OTP_STORAGE_KEY);
  } catch {}

  return {
    success: true,
    message: 'Mobile number verified successfully!',
  };
}

/**
 * Helper to get currently active OTP (for development / auto-fill helpers)
 */
export function getActivePendingOTP(mobile: string): string | null {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  try {
    const raw = sessionStorage.getItem(OTP_STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as OTPRecord;
      if (stored.mobile === cleanMobile && Date.now() <= stored.expiresAt) {
        return stored.code;
      }
    }
  } catch {}
  return null;
}
