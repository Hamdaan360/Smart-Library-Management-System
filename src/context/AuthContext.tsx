import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Student, AdminUser } from '../types';
import {
  verifyStudentRecord,
  linkRegisteredStudent,
  initializeDatabaseIfEmpty,
  VerificationPayload,
  COLLECTIONS,
  updateStudent,
  findStudentByEmailOrId,
  getStudents,
  recordStudentAuthLogInFirebase,
  recordStudentLastLogin,
  getAdmins,
} from '../lib/libraryService';
import { verifyMobileOTP } from '../lib/otpService';
import { INITIAL_ADMINS } from '../lib/seedData';

export const DEFAULT_ADMIN_PASSWORD = 'Hamdaan07';
export const ADMIN_PASSWORD_KEY = 'vvuc_admin_password';
export const STUDENT_SESSION_KEY = 'vvuc_student_active_session';
export const ADMIN_SESSION_KEY = 'vvuc_admin_active_session';
const DEMO_SESSION_KEY = 'vvuc_library_demo_session';

export function getAdminStoredPassword(): string {
  try {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
}

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'student' | null;
  studentProfile: Student | null;
  adminProfile: AdminUser | null;
  adminPassword: string;
  loading: boolean;
  loginStudent: (email: string, pass: string) => Promise<void>;
  loginStudentWithOTP: (mobileOrId: string, otpCode: string) => Promise<void>;
  loginAdmin: (email: string, pass: string) => Promise<void>;
  signupStudent: (payload: VerificationPayload & { email: string; pass: string; mobile: string; isPhoneVerified?: boolean }) => Promise<void>;
  loginDemoAdmin: () => Promise<void>;
  loginDemoStudent: () => Promise<void>;
  logout: () => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateAllowedProfile: (updates: { profilePic?: string; mobile?: string; email?: string }) => Promise<void>;
  changeAdminPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'student' | null>(null);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [adminPassword, setAdminPasswordState] = useState<string>(getAdminStoredPassword());
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize DB collections and restore active session immediately on startup
  useEffect(() => {
    initializeDatabaseIfEmpty();

    try {
      const savedAdmin = localStorage.getItem(ADMIN_SESSION_KEY);
      const savedStudent = localStorage.getItem(STUDENT_SESSION_KEY);
      const demoSession = localStorage.getItem(DEMO_SESSION_KEY);

      if (savedAdmin) {
        const parsed = JSON.parse(savedAdmin);
        setRole('admin');
        setAdminProfile(parsed);
        setStudentProfile(null);
        setLoading(false);
      } else if (savedStudent) {
        const parsed = JSON.parse(savedStudent);
        setRole('student');
        setStudentProfile(parsed);
        setAdminProfile(null);
        setLoading(false);
      } else if (demoSession) {
        const parsed = JSON.parse(demoSession);
        if (parsed.role === 'admin') {
          setRole('admin');
          setAdminProfile(parsed.profile);
          setStudentProfile(null);
        } else if (parsed.role === 'student') {
          setRole('student');
          setStudentProfile(parsed.profile);
          setAdminProfile(null);
        }
        setLoading(false);
      }
    } catch (e) {
      console.warn('Session restore error:', e);
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await resolveUserRoleAndProfile(currentUser);
      } else {
        // If not in Firebase Auth, check if an active student or admin session is stored locally
        const savedAdmin = localStorage.getItem(ADMIN_SESSION_KEY);
        const savedStudent = localStorage.getItem(STUDENT_SESSION_KEY);
        const demoSession = localStorage.getItem(DEMO_SESSION_KEY);

        if (savedAdmin) {
          try {
            const parsed = JSON.parse(savedAdmin);
            setRole('admin');
            setAdminProfile(parsed);
            setStudentProfile(null);
          } catch {}
        } else if (savedStudent) {
          try {
            const parsed = JSON.parse(savedStudent);
            setRole('student');
            setStudentProfile(parsed);
            setAdminProfile(null);
          } catch {}
        } else if (demoSession) {
          try {
            const parsed = JSON.parse(demoSession);
            if (parsed.role === 'admin') {
              setRole('admin');
              setAdminProfile(parsed.profile);
            } else if (parsed.role === 'student') {
              setRole('student');
              setStudentProfile(parsed.profile);
            }
          } catch {}
        } else {
          setUser(null);
          setRole(null);
          setStudentProfile(null);
          setAdminProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function resolveUserRoleAndProfile(firebaseUser: User) {
    try {
      // 1. Check if user is an Admin
      const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, firebaseUser.uid));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data() as AdminUser;
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminData));
        localStorage.removeItem(STUDENT_SESSION_KEY);
        setRole('admin');
        setAdminProfile(adminData);
        setStudentProfile(null);
        return;
      }

      // Check admin by email - Designated Super Administrator
      const isAdminEmail = firebaseUser.email?.toLowerCase() === 'hamdaanai360@gmail.com';
      if (isAdminEmail) {
        const adminData: AdminUser = {
          id: 'admin-vvuc-super',
          uid: firebaseUser.uid,
          email: 'hamdaanai360@gmail.com',
          name: firebaseUser.displayName || 'Hamdaan (Chief Administrator)',
          role: 'superadmin',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminData));
        localStorage.removeItem(STUDENT_SESSION_KEY);
        setRole('admin');
        setAdminProfile(adminData);
        setStudentProfile(null);
        return;
      }

      // 2. Check if student in Firestore roster
      const studentMatch = await findStudentByEmailOrId(firebaseUser.email || firebaseUser.uid);
      if (studentMatch) {
        localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(studentMatch));
        localStorage.removeItem(ADMIN_SESSION_KEY);
        setRole('student');
        setStudentProfile(studentMatch);
        setAdminProfile(null);
        return;
      }

      // Check query by UID
      const studentsCol = collection(db, COLLECTIONS.STUDENTS);
      const q = query(studentsCol, where('uid', '==', firebaseUser.uid));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const student = { ...snap.docs[0].data(), id: snap.docs[0].id } as Student;
        localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(student));
        localStorage.removeItem(ADMIN_SESSION_KEY);
        setRole('student');
        setStudentProfile(student);
        setAdminProfile(null);
      } else {
        // Look up by email
        const qEmail = query(studentsCol, where('email', '==', firebaseUser.email));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          const student = { ...snapEmail.docs[0].data(), id: snapEmail.docs[0].id } as Student;
          localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(student));
          localStorage.removeItem(ADMIN_SESSION_KEY);
          setRole('student');
          setStudentProfile(student);
          setAdminProfile(null);
        } else {
          // If already in a student session, keep that profile
          const savedStudent = localStorage.getItem(STUDENT_SESSION_KEY);
          if (savedStudent) {
            const parsed = JSON.parse(savedStudent);
            setRole('student');
            setStudentProfile(parsed);
            setAdminProfile(null);
          }
        }
      }
    } catch (e) {
      console.error('Error resolving user profile:', e);
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await resolveUserRoleAndProfile(user);
    } else {
      const activeStudent = localStorage.getItem(STUDENT_SESSION_KEY);
      if (activeStudent) {
        try {
          const parsed = JSON.parse(activeStudent);
          if (parsed.id) {
            const snap = await getDoc(doc(db, COLLECTIONS.STUDENTS, parsed.id));
            if (snap.exists()) {
              const updated = { ...snap.data(), id: snap.id } as Student;
              setStudentProfile(updated);
              localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(updated));
            }
          }
        } catch {}
      }
    }
  };

  // Student Login with email/studentId and password
  // STRICT RULE: "student register krne ke baad hi log in hoga"
  const loginStudent = async (identifier: string, pass: string) => {
    setLoading(true);
    try {
      const cleanId = identifier.trim().toLowerCase();
      const cleanPass = pass.trim();

      if (!cleanId || !cleanPass) {
        throw new Error('Please enter both registered Email / Student ID and Password.');
      }

      // Step 1: Strict registration verification in the official database
      const student = await findStudentByEmailOrId(cleanId);
      if (!student) {
        throw new Error(
          'Student account registered nahi hai! Login karne se pehle kripya "Student Registration" form bharein tabhi dashboard khulega.'
        );
      }

      if (student.accountStatus === 'blocked') {
        throw new Error('This student account has been marked as suspended by college administration.');
      }

      // Step 2: Validate password
      let authenticated = false;

      // Direct check against record password
      if (student.password && student.password === cleanPass) {
        authenticated = true;
      }

      // If student was enrolled by admin without custom password, initialize with entered password
      if (!student.password && cleanPass.length >= 4) {
        authenticated = true;
        await linkRegisteredStudent(
          student.id,
          student.uid || 'stu-' + student.id,
          student.email || cleanId,
          student.mobile || '',
          cleanPass
        );
        student.password = cleanPass;
      }

      // Try Firebase Auth in parallel if student has an email
      if (student.email) {
        try {
          const cred = await signInWithEmailAndPassword(auth, student.email.trim(), cleanPass);
          setUser(cred.user);
          authenticated = true;
        } catch {
          // If Firestore password matched, continue even if Firebase Auth failed
        }
      }

      if (!authenticated) {
        // Record failed attempt in Firebase
        await recordStudentAuthLogInFirebase({
          studentId: student.studentId,
          studentName: student.name,
          email: student.email || cleanId,
          mobile: student.mobile || '',
          action: 'login',
          method: 'password',
          status: 'failed',
          details: 'Incorrect password attempt',
        });
        throw new Error('Galat password! Kripya sahi registered password dalein.');
      }

      // Record successful login in Firebase
      await recordStudentAuthLogInFirebase({
        studentId: student.studentId,
        studentName: student.name,
        email: student.email || cleanId,
        mobile: student.mobile || '',
        action: 'login',
        method: 'password',
        status: 'success',
      });
      await recordStudentLastLogin(student.id, 'password');

      // Step 3: Set active student session & open student dashboard
      const activeStudent: Student = {
        ...student,
        isVerified: true,
        accountStatus: 'active',
        lastLoginAt: new Date().toISOString(),
        lastLoginMethod: 'password',
      };

      localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(activeStudent));
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(DEMO_SESSION_KEY);

      setRole('student');
      setStudentProfile(activeStudent);
      setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Student Login with Mobile OTP
  const loginStudentWithOTP = async (mobileOrId: string, otpCode: string) => {
    setLoading(true);
    try {
      const clean = mobileOrId.trim();
      const cleanOtp = otpCode.trim();

      if (!clean) {
        throw new Error('Please enter your registered 10-digit mobile number or Student ID.');
      }
      if (!cleanOtp) {
        throw new Error('Please enter the 6-digit OTP code received on your phone.');
      }

      // Step 1: Find student in database
      const allStudents = await getStudents();
      const cleanDigits = clean.replace(/\D/g, '').slice(-10);

      const student = allStudents.find((s) => {
        const sMob = (s.mobile || '').replace(/\D/g, '').slice(-10);
        const sId = (s.studentId || '').trim().toLowerCase();
        const sRoll = (s.rollNumber || '').trim().toLowerCase();
        return (cleanDigits.length === 10 && sMob === cleanDigits) || sId === clean.toLowerCase() || sRoll === clean.toLowerCase();
      });

      if (!student) {
        throw new Error(
          'Student record nahi mila! Kripya pehle "Student Registration" form bharein aur mobile OTP verify karein.'
        );
      }

      if (student.accountStatus === 'blocked') {
        throw new Error('This student account has been marked as suspended by college administration.');
      }

      // Step 2: Verify OTP
      const verifyResult = verifyMobileOTP(student.mobile, cleanOtp);
      if (!verifyResult.success) {
        // Record failed attempt in Firebase
        await recordStudentAuthLogInFirebase({
          studentId: student.studentId,
          studentName: student.name,
          email: student.email,
          mobile: student.mobile,
          action: 'login',
          method: 'otp',
          status: 'failed',
          details: verifyResult.message,
        });
        throw new Error(verifyResult.message);
      }

      // Step 3: Record successful login in Firebase
      await recordStudentAuthLogInFirebase({
        studentId: student.studentId,
        studentName: student.name,
        email: student.email,
        mobile: student.mobile,
        action: 'login',
        method: 'otp',
        status: 'success',
        details: `OTP Verified for mobile ${student.mobile}`,
      });
      await recordStudentLastLogin(student.id, 'otp');

      // Update phone verification if pending
      if (!student.isPhoneVerified) {
        await updateStudent(student.id, { isPhoneVerified: true, phoneVerifiedAt: new Date().toISOString() }, { uid: 'auth', name: 'OTP Verification' });
        student.isPhoneVerified = true;
      }

      // Step 4: Establish session and open dashboard
      const activeStudent: Student = {
        ...student,
        isVerified: true,
        isPhoneVerified: true,
        accountStatus: 'active',
        lastLoginAt: new Date().toISOString(),
        lastLoginMethod: 'otp',
      };

      localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(activeStudent));
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(DEMO_SESSION_KEY);

      setRole('student');
      setStudentProfile(activeStudent);
      setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Admin Login with email and password
  const loginAdmin = async (email: string, pass: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const currentPass = getAdminStoredPassword();

    try {
      // 1. Superadmin match
      if (cleanEmail === 'hamdaanai360@gmail.com') {
        if (pass !== currentPass) {
          throw new Error(`Invalid password. The administrator password is set to ${currentPass}.`);
        }

        const adminData: AdminUser = {
          id: 'admin-vvuc-super',
          uid: 'admin-hamdaan',
          email: 'hamdaanai360@gmail.com',
          name: 'Hamdaan (Chief Administrator)',
          role: 'superadmin',
          createdAt: new Date().toISOString(),
        };

        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          adminData.uid = cred.user.uid;
          setUser(cred.user);
        } catch {
          // Continue with credentials
        }

        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminData));
        localStorage.removeItem(STUDENT_SESSION_KEY);
        localStorage.removeItem(DEMO_SESSION_KEY);

        setRole('admin');
        setAdminProfile(adminData);
        setStudentProfile(null);
        return;
      }

      // 2. Check Chief Administration Staff saved in Firestore
      const allAdmins = await getAdmins();
      const matchedAdmin = allAdmins.find(
        (a) => (a.email || '').trim().toLowerCase() === cleanEmail
      );

      if (matchedAdmin) {
        const requiredPass = matchedAdmin.password || currentPass;
        if (pass !== requiredPass && pass !== currentPass) {
          throw new Error('Invalid administration password.');
        }

        const adminData: AdminUser = {
          ...matchedAdmin,
          id: matchedAdmin.id || 'admin-' + matchedAdmin.uid,
        };

        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          adminData.uid = cred.user.uid;
          setUser(cred.user);
        } catch {
          // Continue with credentials
        }

        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminData));
        localStorage.removeItem(STUDENT_SESSION_KEY);
        localStorage.removeItem(DEMO_SESSION_KEY);

        setRole('admin');
        setAdminProfile(adminData);
        setStudentProfile(null);
        return;
      }

      // 3. Fallback for admin email keyword
      if (cleanEmail.includes('admin')) {
        if (pass !== currentPass) {
          throw new Error(`Invalid password. The administrator password is set to ${currentPass}.`);
        }

        const adminData: AdminUser = {
          id: 'admin-' + Date.now(),
          uid: 'admin-' + cleanEmail.replace(/[^a-z0-9]/g, ''),
          email: cleanEmail,
          name: 'Chief Administration Staff',
          role: 'admin',
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminData));
        localStorage.removeItem(STUDENT_SESSION_KEY);
        localStorage.removeItem(DEMO_SESSION_KEY);

        setRole('admin');
        setAdminProfile(adminData);
        setStudentProfile(null);
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await resolveUserRoleAndProfile(cred.user);
    } finally {
      setLoading(false);
    }
  };

  // Change Admin Password
  const changeAdminPassword = async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    setLoading(true);
    try {
      localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
      setAdminPasswordState(newPassword);

      if (user && user.email?.toLowerCase() === 'hamdaanai360@gmail.com') {
        try {
          await updatePassword(user, newPassword);
        } catch (e) {
          console.info('Firebase Auth password update notice:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Student Signup with Identity Verification against official roster
  // Immediately logs the student into their dashboard upon successful registration!
  const signupStudent = async (payload: VerificationPayload & { email: string; pass: string; mobile: string; isPhoneVerified?: boolean }) => {
    setLoading(true);
    try {
      const cleanEmail = payload.email.trim().toLowerCase();
      const cleanPass = payload.pass.trim();

      // 1. Verify credentials against official roster or self-register
      const check = await verifyStudentRecord({
        name: payload.name,
        studentId: payload.studentId,
        rollNumber: payload.rollNumber,
        stream: payload.stream,
        classYear: payload.classYear,
        division: payload.division,
      });

      if (!check.verified || !check.studentDoc) {
        throw new Error(
          check.errorMessage ||
            'Student details could not be verified. Please check your information or contact the library administrator.'
        );
      }

      let firebaseUid = 'stu-' + check.studentDoc.id;

      // 2. Try creating Firebase Auth account
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
        await updateProfile(cred.user, { displayName: payload.name.trim() });
        firebaseUid = cred.user.uid;
        setUser(cred.user);
      } catch (authErr: any) {
        console.info('Firebase auth notice during registration:', authErr.code);
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
            firebaseUid = cred.user.uid;
            setUser(cred.user);
          } catch {}
        }
      }

      // 3. Link student document with UID, email, mobile, password, and phone verification
      const isVerifiedMobile = payload.isPhoneVerified ?? true;
      await linkRegisteredStudent(
        check.studentDoc.id,
        firebaseUid,
        cleanEmail,
        payload.mobile.trim(),
        cleanPass,
        isVerifiedMobile
      );

      // Save Student Sign-In / Registration Log in Firebase Firestore
      await recordStudentAuthLogInFirebase({
        studentId: check.studentDoc.studentId,
        studentName: check.studentDoc.name,
        email: cleanEmail,
        mobile: payload.mobile.trim(),
        action: 'registration',
        method: isVerifiedMobile ? 'otp' : 'credentials',
        status: 'success',
        details: `Student registered with stream: ${payload.stream}, Class: ${payload.classYear} Div ${payload.division}`,
      });
      await recordStudentLastLogin(check.studentDoc.id, 'otp');

      // 4. Update local & persistent auth state immediately
      const updatedStudent: Student = {
        ...check.studentDoc,
        uid: firebaseUid,
        email: cleanEmail,
        mobile: payload.mobile.trim(),
        password: cleanPass,
        isVerified: true,
        isPhoneVerified: isVerifiedMobile,
        phoneVerifiedAt: isVerifiedMobile ? new Date().toISOString() : undefined,
        accountStatus: 'active',
        lastLoginAt: new Date().toISOString(),
        lastLoginMethod: 'otp',
      };

      localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(updatedStudent));
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(DEMO_SESSION_KEY);

      setUser((prev) => prev || ({ uid: firebaseUid, email: cleanEmail, displayName: payload.name.trim() } as any));
      setRole('student');
      setStudentProfile(updatedStudent);
      setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Admin Login
  const loginDemoAdmin = async () => {
    setLoading(true);
    try {
      const adminData: AdminUser = {
        id: 'admin-vvuc-super',
        uid: 'admin-hamdaan',
        email: 'hamdaanai360@gmail.com',
        name: 'Hamdaan (Chief Administrator)',
        role: 'superadmin',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminData));
      localStorage.removeItem(STUDENT_SESSION_KEY);
      localStorage.removeItem(DEMO_SESSION_KEY);
      setRole('admin');
      setAdminProfile(adminData);
      setStudentProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Student Login (Aarav Sharma)
  const loginDemoStudent = async () => {
    setLoading(true);
    try {
      const students = await getStudents();
      let studentObj = students.find((s) => s.studentId === 'VVUC-2024-001') || students[0];

      if (!studentObj) {
        studentObj = {
          id: 'student-demo-001',
          studentId: 'VVUC-2024-001',
          rollNumber: '101',
          name: 'Aarav Sharma',
          stream: 'FYJC Science',
          classYear: 'FYJC',
          division: 'A',
          email: 'aarav.sharma@vidyavikas.edu',
          mobile: '9876543210',
          password: 'student123',
          isVerified: true,
          accountStatus: 'active',
          uid: 'student-demo-aarav',
        };
      }

      localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(studentObj));
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(DEMO_SESSION_KEY);
      setRole('student');
      setStudentProfile(studentObj);
      setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem(STUDENT_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(DEMO_SESSION_KEY);
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    setRole(null);
    setStudentProfile(null);
    setAdminProfile(null);
  };

  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const updateAllowedProfile = async (updates: { profilePic?: string; mobile?: string; email?: string }) => {
    if (!studentProfile) throw new Error('No active student session');
    await updateStudent(studentProfile.id, updates, {
      uid: studentProfile.uid || studentProfile.studentId,
      name: studentProfile.name,
    });
    const updated = { ...studentProfile, ...updates };
    setStudentProfile(updated);
    localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        studentProfile,
        adminProfile,
        adminPassword,
        loading,
        loginStudent,
        loginStudentWithOTP,
        loginAdmin,
        signupStudent,
        loginDemoAdmin,
        loginDemoStudent,
        logout,
        sendResetEmail,
        refreshProfile,
        updateAllowedProfile,
        changeAdminPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
