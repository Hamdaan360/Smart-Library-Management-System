import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Book,
  Student,
  IssueTransaction,
  Reservation,
  Fine,
  LibraryNotification,
  Announcement,
  LibrarySettings,
  ActivityLog,
  AdminUser,
  StudentAuthLog,
} from '../types';
import {
  DEFAULT_LIBRARY_SETTINGS,
  INITIAL_ADMINS,
  INITIAL_STUDENTS_ROSTER,
  INITIAL_BOOKS,
  INITIAL_ANNOUNCEMENTS,
} from './seedData';

// Collection references
export const COLLECTIONS = {
  BOOKS: 'books',
  STUDENTS: 'students',
  ADMINS: 'admins',
  ISSUES: 'issues',
  RESERVATIONS: 'reservations',
  FINES: 'fines',
  NOTIFICATIONS: 'notifications',
  ANNOUNCEMENTS: 'announcements',
  SETTINGS: 'librarySettings',
  ACTIVITY_LOGS: 'activityLogs',
  STUDENT_AUTH_LOGS: 'studentAuthLogs',
};

// Auto initialize database if empty
export async function initializeDatabaseIfEmpty() {
  try {
    // 1. Check settings
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'default');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, DEFAULT_LIBRARY_SETTINGS);
    } else {
      // Ensure campus location, email, and 5 PM hours are synchronized
      const current = settingsSnap.data() as Partial<LibrarySettings>;
      if (
        current.email !== DEFAULT_LIBRARY_SETTINGS.email ||
        current.openingHours !== DEFAULT_LIBRARY_SETTINGS.openingHours ||
        current.address !== DEFAULT_LIBRARY_SETTINGS.address ||
        current.contact !== ''
      ) {
        await updateDoc(settingsRef, {
          address: DEFAULT_LIBRARY_SETTINGS.address,
          openingHours: DEFAULT_LIBRARY_SETTINGS.openingHours,
          email: DEFAULT_LIBRARY_SETTINGS.email,
          contact: '',
        });
      }
    }

    // 2. Check admin
    for (const admin of INITIAL_ADMINS) {
      const adminRef = doc(db, COLLECTIONS.ADMINS, admin.uid);
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) {
        await setDoc(adminRef, admin);
      }
    }

    // 3. Check books (only if INITIAL_BOOKS provided)
    if (INITIAL_BOOKS.length > 0) {
      const booksCol = collection(db, COLLECTIONS.BOOKS);
      const booksSnap = await getDocs(booksCol);
      if (booksSnap.empty) {
        const batch = writeBatch(db);
        for (const book of INITIAL_BOOKS) {
          const newDocRef = doc(booksCol);
          batch.set(newDocRef, { ...book, id: newDocRef.id });
        }
        await batch.commit();
      }
    }

    // 4. Check official student roster (only if INITIAL_STUDENTS_ROSTER provided)
    if (INITIAL_STUDENTS_ROSTER.length > 0) {
      const studentsCol = collection(db, COLLECTIONS.STUDENTS);
      const studentsSnap = await getDocs(studentsCol);
      if (studentsSnap.empty) {
        const batch = writeBatch(db);
        for (const student of INITIAL_STUDENTS_ROSTER) {
          const newDocRef = doc(studentsCol);
          batch.set(newDocRef, { ...student, id: newDocRef.id });
        }
        await batch.commit();
      }
    }

    // 5. Check announcements
    const annCol = collection(db, COLLECTIONS.ANNOUNCEMENTS);
    const annSnap = await getDocs(annCol);
    if (annSnap.empty && INITIAL_ANNOUNCEMENTS.length > 0) {
      const batch = writeBatch(db);
      for (const ann of INITIAL_ANNOUNCEMENTS) {
        const newDocRef = doc(annCol);
        batch.set(newDocRef, { ...ann, id: newDocRef.id });
      }
      await batch.commit();
    }
  } catch (err) {
    console.warn('Initialization check finished (network or offline):', err);
  }
}

// Clear all pre-existing books, students, and circulation records for fresh custom data
export async function clearAllBooksAndStudents(admin?: { uid: string; name: string }): Promise<{ deletedBooks: number; deletedStudents: number }> {
  let deletedBooks = 0;
  let deletedStudents = 0;

  // 1. Delete all books
  const booksSnap = await getDocs(collection(db, COLLECTIONS.BOOKS));
  for (const d of booksSnap.docs) {
    await deleteDoc(d.ref);
    deletedBooks++;
  }

  // 2. Delete all students
  const studentsSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
  for (const d of studentsSnap.docs) {
    await deleteDoc(d.ref);
    deletedStudents++;
  }

  // 3. Delete issues/circulation records
  const issuesSnap = await getDocs(collection(db, COLLECTIONS.ISSUES));
  for (const d of issuesSnap.docs) {
    await deleteDoc(d.ref);
  }

  // 4. Delete reservations
  const resSnap = await getDocs(collection(db, COLLECTIONS.RESERVATIONS));
  for (const d of resSnap.docs) {
    await deleteDoc(d.ref);
  }

  // 5. Delete fines
  const finesSnap = await getDocs(collection(db, COLLECTIONS.FINES));
  for (const d of finesSnap.docs) {
    await deleteDoc(d.ref);
  }

  // 6. Delete notifications
  const notifSnap = await getDocs(collection(db, COLLECTIONS.NOTIFICATIONS));
  for (const d of notifSnap.docs) {
    await deleteDoc(d.ref);
  }

  try {
    await logActivity({
      adminId: admin?.uid || 'admin-hamdaan',
      adminName: admin?.name || 'Hamdaan (Chief Administrator)',
      action: 'Clear Database',
      entity: 'System',
      entityId: 'ALL_RECORDS',
      details: `Cleared ${deletedBooks} books and ${deletedStudents} students to start fresh with real college data.`,
    });
  } catch (e) {
    console.warn('Could not log clear activity:', e);
  }

  return { deletedBooks, deletedStudents };
}

// Reset / Seed Demo Data
export async function seedFreshDemoData() {
  const batch = writeBatch(db);
  // Settings
  const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'default');
  batch.set(settingsRef, DEFAULT_LIBRARY_SETTINGS);

  // Admin
  for (const admin of INITIAL_ADMINS) {
    const adminRef = doc(db, COLLECTIONS.ADMINS, admin.uid);
    batch.set(adminRef, admin);
  }

  // Books
  const booksCol = collection(db, COLLECTIONS.BOOKS);
  for (const book of INITIAL_BOOKS) {
    const newDocRef = doc(booksCol);
    batch.set(newDocRef, { ...book, id: newDocRef.id });
  }

  // Students roster
  const studentsCol = collection(db, COLLECTIONS.STUDENTS);
  for (const student of INITIAL_STUDENTS_ROSTER) {
    const newDocRef = doc(studentsCol);
    batch.set(newDocRef, { ...student, id: newDocRef.id });
  }

  // Announcements
  const annCol = collection(db, COLLECTIONS.ANNOUNCEMENTS);
  for (const ann of INITIAL_ANNOUNCEMENTS) {
    const newDocRef = doc(annCol);
    batch.set(newDocRef, { ...ann, id: newDocRef.id });
  }

  await batch.commit();
  await logActivity({
    adminId: 'system',
    adminName: 'System Administrator',
    action: 'Seed Initial Demo Data',
    entity: 'Database',
    entityId: 'ALL',
    details: 'Preloaded official student roster, curriculum books, and announcements',
  });
}

// ==================== SETTINGS ====================
export async function getLibrarySettings(): Promise<LibrarySettings> {
  try {
    const settingsDoc = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'default'));
    if (settingsDoc.exists()) {
      return settingsDoc.data() as LibrarySettings;
    }
  } catch (e) {
    console.error('Error fetching settings:', e);
  }
  return DEFAULT_LIBRARY_SETTINGS;
}

export async function updateLibrarySettings(settings: LibrarySettings, admin?: { uid: string; name: string } | string): Promise<void> {
  const adminObj = typeof admin === 'string' ? { uid: 'admin', name: admin } : admin || { uid: 'admin', name: 'Chief Librarian' };
  await setDoc(doc(db, COLLECTIONS.SETTINGS, 'default'), settings);
  await logActivity({
    adminId: adminObj.uid,
    adminName: adminObj.name,
    action: 'Update Library Settings',
    entity: 'Settings',
    entityId: 'default',
    details: `Updated borrowing policy: max ${settings.maxBooksPerStudent} books, fine ₹${settings.finePerDay}/day`,
  });
}

// ==================== BOOKS ====================
export async function getBooks(): Promise<Book[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.BOOKS));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Book));
  } catch (e) {
    console.error('Failed to get books:', e);
    return [];
  }
}

export async function addBook(bookData: Omit<Book, 'id'>, admin: { uid: string; name: string } | string): Promise<string> {
  const adminObj = typeof admin === 'string' ? { uid: 'admin-hamdaan', name: admin } : (admin || { uid: 'admin-hamdaan', name: 'Hamdaan (Chief Administrator)' });
  const sanitizedCover = bookData.coverImage && bookData.coverImage.trim() 
    ? bookData.coverImage.trim() 
    : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';

  const docRef = await addDoc(collection(db, COLLECTIONS.BOOKS), {
    ...bookData,
    coverImage: sanitizedCover,
    hasEbook: Boolean(bookData.pdfUrl && bookData.pdfUrl.trim() !== ''),
    pdfUrl: bookData.pdfUrl || '',
    ebookFileName: bookData.ebookFileName || '',
    ebookFileSize: bookData.ebookFileSize || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(docRef, { id: docRef.id });

  await logActivity({
    adminId: adminObj.uid,
    adminName: adminObj.name,
    action: 'Add New Book',
    entity: 'Book',
    entityId: bookData.bookId,
    details: `Added "${bookData.title}" by ${bookData.author} (${bookData.totalCopies} copies, Shelf: ${bookData.shelfNumber}${bookData.pdfUrl ? ', with Softcopy E-Book' : ''})`,
  });

  return docRef.id;
}

export async function updateBook(id: string, updates: Partial<Book>, admin: { uid: string; name: string } | string): Promise<void> {
  const adminObj = typeof admin === 'string' ? { uid: 'admin-hamdaan', name: admin } : (admin || { uid: 'admin-hamdaan', name: 'Hamdaan (Chief Administrator)' });
  const bookRef = doc(db, COLLECTIONS.BOOKS, id);
  const currentSnap = await getDoc(bookRef);
  if (!currentSnap.exists()) throw new Error('Book not found');
  const current = currentSnap.data() as Book;

  // Recalculate available copies if total copies changed
  let newTotal = updates.totalCopies !== undefined ? updates.totalCopies : current.totalCopies;
  let newIssued = current.issuedCopies || 0;
  if (newTotal < newIssued) {
    throw new Error(`Cannot set total copies (${newTotal}) lower than currently issued copies (${newIssued}).`);
  }
  let newAvailable = newTotal - newIssued;
  let status = newAvailable > 0 ? (newAvailable <= 1 ? 'low_stock' : 'available') : 'out_of_stock';

  const sanitizedUpdates: Partial<Book> = { ...updates };
  if (updates.coverImage !== undefined) {
    sanitizedUpdates.coverImage = updates.coverImage && updates.coverImage.trim()
      ? updates.coverImage.trim()
      : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
  }
  if (updates.pdfUrl !== undefined) {
    sanitizedUpdates.pdfUrl = updates.pdfUrl || '';
    sanitizedUpdates.hasEbook = Boolean(updates.pdfUrl && updates.pdfUrl.trim() !== '');
  }

  await updateDoc(bookRef, {
    ...sanitizedUpdates,
    totalCopies: newTotal,
    availableCopies: newAvailable,
    issuedCopies: newIssued,
    status,
    updatedAt: new Date().toISOString(),
  });

  await logActivity({
    adminId: adminObj.uid,
    adminName: adminObj.name,
    action: 'Update Book Details',
    entity: 'Book',
    entityId: current.bookId,
    details: `Modified book details for "${updates.title || current.title}"`,
  });
}

export async function deleteBook(id: string, admin: { uid: string; name: string } | string): Promise<void> {
  const adminObj = typeof admin === 'string' ? { uid: 'admin-hamdaan', name: admin } : (admin || { uid: 'admin-hamdaan', name: 'Hamdaan (Chief Administrator)' });
  const bookRef = doc(db, COLLECTIONS.BOOKS, id);
  const snap = await getDoc(bookRef);
  if (!snap.exists()) throw new Error('Book not found');
  const book = snap.data() as Book;

  if (book.issuedCopies > 0) {
    throw new Error(`Cannot delete book "${book.title}". There are currently ${book.issuedCopies} issued copy(ies) on loan.`);
  }

  await deleteDoc(bookRef);
  await logActivity({
    adminId: adminObj.uid,
    adminName: adminObj.name,
    action: 'Delete Book',
    entity: 'Book',
    entityId: book.bookId,
    details: `Removed book "${book.title}" (ISBN: ${book.isbn}) from catalog`,
  });
}

// ==================== STUDENT VERIFICATION & ROSTER ====================
export interface VerificationPayload {
  name: string;
  studentId: string;
  rollNumber: string;
  stream: string;
  classYear: string;
  division: string;
}

export async function verifyStudentRecord(payload: VerificationPayload): Promise<{
  verified: boolean;
  studentDoc?: Student;
  errorMessage?: string;
}> {
  try {
    const studentsCol = collection(db, COLLECTIONS.STUDENTS);
    const snap = await getDocs(studentsCol);

    const norm = (s: string) => (s || '').trim().toLowerCase();

    // Check for match
    const matchingDoc = snap.docs.find((d) => {
      const data = d.data() as Student;
      return (
        norm(data.studentId) === norm(payload.studentId) &&
        norm(data.rollNumber) === norm(payload.rollNumber) &&
        norm(data.name) === norm(payload.name) &&
        norm(data.stream) === norm(payload.stream) &&
        norm(data.classYear) === norm(payload.classYear) &&
        norm(data.division) === norm(payload.division)
      );
    });

    if (!matchingDoc) {
      // Check if student with same ID already exists with different details
      const existingSameId = snap.docs.find((d) => norm((d.data() as Student).studentId) === norm(payload.studentId));
      if (existingSameId) {
        return {
          verified: false,
          errorMessage: `Student ID "${payload.studentId}" is already assigned to a student record. Please verify your details or contact the library desk.`,
        };
      }

      // If database is clean or student self-registers, create the student profile directly
      const newStudentData: Omit<Student, 'id'> = {
        studentId: payload.studentId.trim(),
        rollNumber: payload.rollNumber.trim(),
        name: payload.name.trim(),
        stream: payload.stream.trim(),
        classYear: payload.classYear.trim(),
        division: payload.division.trim(),
        email: '',
        mobile: '',
        isVerified: true,
        accountStatus: 'active',
        registeredAt: new Date().toISOString(),
      };
      const newDoc = await addDoc(studentsCol, newStudentData);
      await updateDoc(newDoc, { id: newDoc.id });
      return {
        verified: true,
        studentDoc: { ...newStudentData, id: newDoc.id },
      };
    }

    const studentData = { ...matchingDoc.data(), id: matchingDoc.id } as Student;

    // Check if student already registered with an active Auth UID
    if (studentData.uid) {
      return {
        verified: false,
        errorMessage: 'An account has already been registered for this Student ID. Please log in directly or use forgot password.',
      };
    }

    if (studentData.accountStatus === 'blocked') {
      return {
        verified: false,
        errorMessage: 'This student account has been marked as suspended by college administration.',
      };
    }

    return {
      verified: true,
      studentDoc: studentData,
    };
  } catch (err: any) {
    console.error('Error during student verification:', err);
    return {
      verified: false,
      errorMessage: err.message || 'Verification service error. Please try again.',
    };
  }
}

export async function linkRegisteredStudent(
  studentDocId: string,
  uid: string,
  email: string,
  mobile: string,
  password?: string,
  isPhoneVerified: boolean = false
): Promise<void> {
  const studentRef = doc(db, COLLECTIONS.STUDENTS, studentDocId);
  const nowIso = new Date().toISOString();
  const updates: any = {
    uid,
    email: email.trim().toLowerCase(),
    mobile: mobile.trim(),
    isVerified: true,
    accountStatus: 'active',
    registeredAt: nowIso,
    isPhoneVerified: isPhoneVerified,
    phoneVerifiedAt: isPhoneVerified ? nowIso : null,
  };
  if (password) {
    updates.password = password;
  }
  await updateDoc(studentRef, updates);

  // Create welcome notification
  try {
    await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      studentUid: uid,
      studentId: studentDocId,
      title: 'Welcome to Vidya Vikas Universal College Library!',
      message: 'Your student identity is verified. You can now search our catalog, reserve books, and track borrow history.',
      type: 'announcement',
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Notification creation notice:', err);
  }
}

/**
 * Saves student sign-in / login record directly into Firebase Firestore
 */
export async function recordStudentAuthLogInFirebase(
  log: Omit<StudentAuthLog, 'id' | 'timestamp'> & { timestamp?: string }
): Promise<string> {
  try {
    const timestamp = log.timestamp || new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTIONS.STUDENT_AUTH_LOGS), {
      ...log,
      timestamp,
      ipDevice: log.ipDevice || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Web'),
    });

    // Also register audit activity
    await logActivity({
      adminId: 'student-auth',
      adminName: 'Security & Auth System',
      action: log.action === 'registration' ? 'Student Registered' : 'Student Login',
      entity: 'StudentAuth',
      entityId: log.studentId,
      details: `${log.studentName} (${log.studentId}) ${log.action === 'registration' ? 'completed registration' : 'logged in'} via ${log.method}. Mobile: ${log.mobile || 'N/A'}. Status: ${log.status}`,
    });

    return docRef.id;
  } catch (error) {
    console.warn('Failed to record student auth log in Firebase:', error);
    return '';
  }
}

/**
 * Updates student document with last login time and method in Firestore
 */
export async function recordStudentLastLogin(
  studentDocId: string,
  method: 'password' | 'otp'
): Promise<void> {
  try {
    const studentRef = doc(db, COLLECTIONS.STUDENTS, studentDocId);
    const snap = await getDoc(studentRef);
    const currentCount = snap.exists() ? (snap.data().loginCount || 0) : 0;

    await updateDoc(studentRef, {
      lastLoginAt: new Date().toISOString(),
      lastLoginMethod: method,
      loginCount: currentCount + 1,
    });
  } catch (err) {
    console.warn('Failed to update student last login timestamp:', err);
  }
}

/**
 * Retrieves student sign-in and login logs from Firebase Firestore
 */
export async function getStudentAuthLogs(): Promise<StudentAuthLog[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.STUDENT_AUTH_LOGS));
    const list = snap.docs.map((d) => ({ ...d.data(), id: d.id } as StudentAuthLog));
    return list.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });
  } catch (err) {
    console.error('Failed to get student auth logs from Firestore:', err);
    return [];
  }
}

/**
 * Fetch all registered administration staff from Firestore
 */
export async function getAdmins(): Promise<AdminUser[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.ADMINS));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as AdminUser));
  } catch (err) {
    console.warn('Failed to get admins from Firestore:', err);
    return INITIAL_ADMINS;
  }
}

/**
 * Add a new Chief Administration Staff member with email and password
 */
export async function addAdminStaff(
  adminData: { email: string; name: string; password?: string; role?: 'admin' | 'librarian' | 'superadmin' },
  performedBy?: { uid: string; name: string }
): Promise<string> {
  const uid = 'admin-' + Date.now();
  const cleanEmail = adminData.email.trim().toLowerCase();
  const newAdmin: AdminUser = {
    id: uid,
    uid,
    email: cleanEmail,
    name: adminData.name.trim(),
    role: adminData.role || 'admin',
    createdAt: new Date().toISOString(),
    password: adminData.password || undefined,
  };

  const adminRef = doc(db, COLLECTIONS.ADMINS, uid);
  await setDoc(adminRef, newAdmin);

  await logActivity({
    adminId: performedBy?.uid || 'superadmin',
    adminName: performedBy?.name || 'Chief Administrator',
    action: 'Added Admin Staff',
    entity: 'AdminUser',
    entityId: uid,
    details: `Added new administration staff: ${newAdmin.name} (${newAdmin.email}) with role ${newAdmin.role}`,
  });

  return uid;
}

/**
 * Delete an administration staff member
 */
export async function deleteAdminStaff(
  adminDocId: string,
  performedBy?: { uid: string; name: string }
): Promise<void> {
  const adminRef = doc(db, COLLECTIONS.ADMINS, adminDocId);
  const snap = await getDoc(adminRef);
  const adminName = snap.exists() ? snap.data().name : adminDocId;

  await deleteDoc(adminRef);

  await logActivity({
    adminId: performedBy?.uid || 'superadmin',
    adminName: performedBy?.name || 'Chief Administrator',
    action: 'Deleted Admin Staff',
    entity: 'AdminUser',
    entityId: adminDocId,
    details: `Removed administration staff member: ${adminName}`,
  });
}

export async function findStudentByEmailOrId(identifier: string): Promise<Student | null> {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  try {
    const students = await getStudents();
    return (
      students.find((s) => {
        const email = (s.email || '').trim().toLowerCase();
        const studentId = (s.studentId || '').trim().toLowerCase();
        const rollNumber = (s.rollNumber || '').trim().toLowerCase();
        return email === clean || studentId === clean || rollNumber === clean;
      }) || null
    );
  } catch (err) {
    console.error('Error finding student by email or ID:', err);
    return null;
  }
}

export async function getStudents(): Promise<Student[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Student));
  } catch (e) {
    console.error('Failed to get students:', e);
    return [];
  }
}

export async function addStudentToRoster(student: Omit<Student, 'id'>, admin: { uid: string; name: string }): Promise<string> {
  // Check duplicate Student ID or Roll Number in same stream/division
  const existing = await getStudents();
  const duplicateId = existing.find((s) => s.studentId.trim().toLowerCase() === student.studentId.trim().toLowerCase());
  if (duplicateId) {
    throw new Error(`Student ID "${student.studentId}" is already assigned to ${duplicateId.name}.`);
  }

  const duplicateRoll = existing.find(
    (s) =>
      s.rollNumber.trim() === student.rollNumber.trim() &&
      s.stream.trim().toLowerCase() === student.stream.trim().toLowerCase() &&
      s.classYear.trim().toLowerCase() === student.classYear.trim().toLowerCase() &&
      s.division.trim().toLowerCase() === student.division.trim().toLowerCase()
  );
  if (duplicateRoll) {
    throw new Error(`Roll No. "${student.rollNumber}" is already assigned in ${student.classYear} ${student.stream} Div ${student.division}.`);
  }

  const docRef = await addDoc(collection(db, COLLECTIONS.STUDENTS), {
    ...student,
    isVerified: true,
    accountStatus: student.accountStatus || 'active',
  });
  await updateDoc(docRef, { id: docRef.id });

  await logActivity({
    adminId: admin.uid,
    adminName: admin.name,
    action: 'Add Student Record',
    entity: 'Student',
    entityId: student.studentId,
    details: `Enrolled official student ${student.name} (Roll: ${student.rollNumber}, Stream: ${student.stream})`,
  });

  return docRef.id;
}

export async function updateStudent(id: string, updates: Partial<Student>, admin: { uid: string; name: string }): Promise<void> {
  const studentRef = doc(db, COLLECTIONS.STUDENTS, id);
  await updateDoc(studentRef, updates);

  await logActivity({
    adminId: admin.uid,
    adminName: admin.name,
    action: 'Update Student Record',
    entity: 'Student',
    entityId: updates.studentId || id,
    details: `Updated details/status for student ID ${id}`,
  });
}

export async function deleteStudent(id: string, admin: { uid: string; name: string }): Promise<void> {
  const studentRef = doc(db, COLLECTIONS.STUDENTS, id);
  const snap = await getDoc(studentRef);
  if (!snap.exists()) throw new Error('Student not found');
  const st = snap.data() as Student;

  // Check if student has currently issued books
  const activeIssues = await getIssuesByStudent(id);
  const currentlyIssued = activeIssues.filter((i) => i.status === 'issued' || i.status === 'overdue');
  if (currentlyIssued.length > 0) {
    throw new Error(`Cannot delete student ${st.name}. They have ${currentlyIssued.length} unreturned book(s).`);
  }

  await deleteDoc(studentRef);
  await logActivity({
    adminId: admin.uid,
    adminName: admin.name,
    action: 'Delete Student',
    entity: 'Student',
    entityId: st.studentId,
    details: `Removed student record for ${st.name}`,
  });
}

// ==================== BOOK ISSUE & RETURN TRANSACTIONS ====================
export type IssuePayload =
  | {
      studentDocId: string;
      bookDocId: string;
      dueDate: string;
      admin: { uid: string; name: string };
    }
  | {
      student: Student;
      book: Book;
      issueDate?: string;
      dueDate: string;
      issuedBy?: string | { uid: string; name: string };
    };

export async function issueBookTransaction(payload: IssuePayload): Promise<{ transactionId: string; issueId: string }> {
  const studentDocId = 'studentDocId' in payload ? payload.studentDocId : payload.student.id;
  const bookDocId = 'bookDocId' in payload ? payload.bookDocId : payload.book.id;
  const dueDate = payload.dueDate;
  const admin =
    'admin' in payload
      ? payload.admin
      : typeof payload.issuedBy === 'string'
      ? { uid: 'admin', name: payload.issuedBy }
      : payload.issuedBy || { uid: 'admin', name: 'Chief Librarian' };

  const settings = await getLibrarySettings();
  const transactionId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
  let issueId = '';

  await runTransaction(db, async (transaction) => {
    // 1. Read Student
    const studentRef = doc(db, COLLECTIONS.STUDENTS, studentDocId);
    const studentSnap = await transaction.get(studentRef);
    if (!studentSnap.exists()) {
      throw new Error('Selected student does not exist.');
    }
    const student = studentSnap.data() as Student;

    if (student.accountStatus === 'blocked') {
      throw new Error(`Student ${student.name} is currently suspended/blocked by library.`);
    }

    // 2. Read Book
    const bookRef = doc(db, COLLECTIONS.BOOKS, bookDocId);
    const bookSnap = await transaction.get(bookRef);
    if (!bookSnap.exists()) {
      throw new Error('Selected book does not exist.');
    }
    const book = bookSnap.data() as Book;

    if (book.availableCopies <= 0) {
      throw new Error(`Book "${book.title}" has 0 available copies for issue.`);
    }

    // 3. Check current issued books limit
    const issuesCol = collection(db, COLLECTIONS.ISSUES);
    const q = query(issuesCol, where('studentDocId', '==', studentDocId), where('status', 'in', ['issued', 'overdue']));
    const activeIssuesSnap = await getDocs(q);

    if (activeIssuesSnap.docs.length >= settings.maxBooksPerStudent) {
      throw new Error(
        `Borrowing limit exceeded: Student ${student.name} already has ${activeIssuesSnap.docs.length} books issued (Maximum allowed: ${settings.maxBooksPerStudent}).`
      );
    }

    // Check if student already holds a copy of this same book
    const alreadyHolding = activeIssuesSnap.docs.some((d) => (d.data() as IssueTransaction).bookDocId === bookDocId);
    if (alreadyHolding) {
      throw new Error(`Student ${student.name} already has an active borrowed copy of "${book.title}".`);
    }

    // 4. Update Book counts
    const newAvailable = book.availableCopies - 1;
    const newIssued = (book.issuedCopies || 0) + 1;
    const newStatus = newAvailable === 0 ? 'out_of_stock' : newAvailable <= 1 ? 'low_stock' : 'available';

    transaction.update(bookRef, {
      availableCopies: newAvailable,
      issuedCopies: newIssued,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    // 5. Create Issue document
    const newIssueRef = doc(collection(db, COLLECTIONS.ISSUES));
    issueId = newIssueRef.id;

    const issueData: IssueTransaction = {
      id: issueId,
      transactionId,
      studentId: student.studentId,
      studentUid: student.uid || '',
      studentDocId,
      studentName: student.name,
      rollNumber: student.rollNumber,
      bookId: book.bookId,
      bookDocId,
      bookTitle: book.title,
      adminId: admin.uid,
      adminName: admin.name,
      issueDate: ('issueDate' in payload && payload.issueDate) ? payload.issueDate : new Date().toISOString().split('T')[0],
      dueDate,
      returnDate: null,
      status: 'issued',
      fineAmount: 0,
      overdueDays: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    transaction.set(newIssueRef, issueData);

    // 6. Create Student Notification
    if (student.uid) {
      const notifRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
      transaction.set(notifRef, {
        studentUid: student.uid,
        studentId: student.studentId,
        title: 'Book Issued Successfully',
        message: `"${book.title}" has been issued to you. Due date: ${dueDate}. Please return on or before the due date to avoid fines.`,
        type: 'issue',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    // 7. Activity Log
    const logRef = doc(collection(db, COLLECTIONS.ACTIVITY_LOGS));
    const now = new Date();
    transaction.set(logRef, {
      adminId: admin.uid,
      adminName: admin.name,
      action: 'Issue Book',
      entity: 'Transaction',
      entityId: transactionId,
      details: `Issued "${book.title}" to ${student.name} (ID: ${student.studentId}, Due: ${dueDate})`,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString(),
      timestamp: Date.now(),
    });
  });

  return { transactionId, issueId };
}

export type ReturnPayload =
  | {
      issueDocId: string;
      admin: { uid: string; name: string };
      returnDate?: string;
      customFine?: number;
    }
  | {
      issue: IssueTransaction;
      returnDate?: string;
      receivedBy?: string | { uid: string; name: string };
      overdueDays?: number;
      fineAmount?: number;
      fineStatus?: 'paid' | 'waived' | 'unpaid';
      waiverReason?: string;
    };

export async function returnBookTransaction(payload: ReturnPayload): Promise<{ fineAmount: number; overdueDays: number }> {
  const issueDocId = 'issueDocId' in payload ? payload.issueDocId : payload.issue.id;
  const admin =
    'admin' in payload
      ? payload.admin
      : typeof payload.receivedBy === 'string'
      ? { uid: 'admin', name: payload.receivedBy }
      : payload.receivedBy || { uid: 'admin', name: 'Chief Librarian' };

  const returnDate = payload.returnDate || new Date().toISOString().split('T')[0];
  const settings = await getLibrarySettings();

  let finalFineAmount = 0;
  let finalOverdueDays = 0;

  await runTransaction(db, async (transaction) => {
    // 1. Read Issue
    const issueRef = doc(db, COLLECTIONS.ISSUES, issueDocId);
    const issueSnap = await transaction.get(issueRef);
    if (!issueSnap.exists()) {
      throw new Error('Issue transaction not found.');
    }
    const issue = issueSnap.data() as IssueTransaction;
    if (issue.status === 'returned') {
      throw new Error('This book has already been marked as returned.');
    }

    // 2. Read Book
    const bookRef = doc(db, COLLECTIONS.BOOKS, issue.bookDocId);
    const bookSnap = await transaction.get(bookRef);

    if (bookSnap.exists()) {
      const book = bookSnap.data() as Book;
      const newAvailable = (book.availableCopies || 0) + 1;
      const newIssued = Math.max(0, (book.issuedCopies || 1) - 1);
      const newStatus = newAvailable > 0 ? 'available' : 'out_of_stock';

      transaction.update(bookRef, {
        availableCopies: newAvailable,
        issuedCopies: newIssued,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Calculate Overdue & Fine
    const dueTime = new Date(issue.dueDate).getTime();
    const retTime = new Date(returnDate).getTime();
    const diffDays = Math.floor((retTime - dueTime) / (1000 * 60 * 60 * 24));
    const overdueDays = Math.max(0, diffDays);

    let fine = 0;
    if ('customFine' in payload && payload.customFine !== undefined) {
      fine = payload.customFine;
    } else if ('fineAmount' in payload && payload.fineAmount !== undefined) {
      fine = payload.fineAmount;
    } else if (overdueDays > settings.gracePeriodDays) {
      fine = Math.min(settings.maxFine, (overdueDays - settings.gracePeriodDays) * settings.finePerDay);
    }

    finalFineAmount = fine;
    finalOverdueDays = overdueDays;

    // 4. Update Issue
    transaction.update(issueRef, {
      returnDate,
      status: 'returned',
      fineAmount: fine,
      overdueDays,
      returnedByAdminId: admin.uid,
      updatedAt: new Date().toISOString(),
    });

    // 5. Create Fine Record if fine > 0
    if (fine > 0) {
      const fineRef = doc(collection(db, COLLECTIONS.FINES));
      const fineStatus = ('fineStatus' in payload && payload.fineStatus) ? payload.fineStatus : 'unpaid';
      const notes = ('waiverReason' in payload && payload.waiverReason) ? payload.waiverReason : '';

      transaction.set(fineRef, {
        id: fineRef.id,
        issueId: issueDocId,
        transactionId: issue.transactionId,
        studentId: issue.studentId,
        studentUid: issue.studentUid || '',
        studentName: issue.studentName,
        rollNumber: issue.rollNumber,
        bookTitle: issue.bookTitle,
        amount: fine,
        overdueDays,
        status: fineStatus,
        notes,
        paidAt: fineStatus === 'paid' ? new Date().toISOString() : null,
        waivedAt: fineStatus === 'waived' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      });
    }

    // 6. Notification to Student
    if (issue.studentUid) {
      const notifRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
      transaction.set(notifRef, {
        studentUid: issue.studentUid,
        studentId: issue.studentId,
        title: 'Book Return Confirmed',
        message: `Your return of "${issue.bookTitle}" has been processed.${fine > 0 ? ` Overdue fine of ₹${fine} is recorded.` : ' Thank you for returning it on time!'}`,
        type: 'return',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    // 7. Activity Log
    const logRef = doc(collection(db, COLLECTIONS.ACTIVITY_LOGS));
    const now = new Date();
    transaction.set(logRef, {
      adminId: admin.uid,
      adminName: admin.name,
      action: 'Return Book',
      entity: 'Transaction',
      entityId: issue.transactionId,
      details: `Returned "${issue.bookTitle}" by ${issue.studentName} (Overdue: ${overdueDays} days, Fine: ₹${fine})`,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString(),
      timestamp: Date.now(),
    });
  });

  // Check if any student has an active reservation for this book
  try {
    const resCol = collection(db, COLLECTIONS.RESERVATIONS);
    const resQ = query(resCol, where('bookDocId', '==', issueDocId), where('status', '==', 'pending'));
    const resSnap = await getDocs(resQ);
    for (const rDoc of resSnap.docs) {
      const res = rDoc.data() as Reservation;
      await updateDoc(rDoc.ref, { status: 'approved', updatedAt: new Date().toISOString() });
      if (res.studentUid) {
        await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
          studentUid: res.studentUid,
          studentId: res.studentId,
          title: 'Reserved Book Available!',
          message: `Good news! "${res.bookTitle}" is now available at the circulation counter. Please visit within 3 days to borrow it.`,
          type: 'reservation',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('Error checking pending reservations:', err);
  }

  return { fineAmount: finalFineAmount, overdueDays: finalOverdueDays };
}

// ==================== RESERVATIONS ====================
export async function createBookReservation(payload: {
  student: Student;
  book: Book;
  notes?: string;
}): Promise<string> {
  const { student, book, notes } = payload;
  const settings = await getLibrarySettings();

  if (!settings.enableReservations) {
    throw new Error('Book reservations are currently disabled by the library administrator.');
  }

  // Check existing active reservation by this student for this book
  const resCol = collection(db, COLLECTIONS.RESERVATIONS);
  const q = query(
    resCol,
    where('studentId', '==', student.studentId),
    where('bookDocId', '==', book.id),
    where('status', 'in', ['pending', 'approved'])
  );
  const existingSnap = await getDocs(q);
  if (!existingSnap.empty) {
    throw new Error('You already have an active reservation for this book.');
  }

  const reservationId = `RES-${Math.floor(100 + Math.random() * 900)}`;
  const docRef = await addDoc(resCol, {
    reservationId,
    studentId: student.studentId,
    studentUid: student.uid || '',
    studentName: student.name,
    bookId: book.bookId,
    bookDocId: book.id,
    bookTitle: book.title,
    requestDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(docRef, { id: docRef.id });

  // In-app notification for the student
  if (student.uid) {
    await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      studentUid: student.uid,
      studentId: student.studentId,
      title: 'Reservation Placed',
      message: `Your reservation request #${reservationId} for "${book.title}" has been registered. You will be notified as soon as a copy is returned.`,
      type: 'reservation',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  return docRef.id;
}

export async function getReservations(): Promise<Reservation[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.RESERVATIONS));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Reservation));
  } catch (e) {
    console.error('Failed to get reservations:', e);
    return [];
  }
}

export async function updateReservationStatus(
  reservationId: string,
  status: Reservation['status'],
  admin?: { uid: string; name: string } | string
): Promise<void> {
  const adminObj = typeof admin === 'string' ? { uid: 'admin', name: admin } : admin || { uid: 'admin', name: 'Chief Librarian' };
  const ref = doc(db, COLLECTIONS.RESERVATIONS, reservationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Reservation not found');
  const res = snap.data() as Reservation;

  await updateDoc(ref, { status, updatedAt: new Date().toISOString() });

  if (res.studentUid) {
    let msg = `Your reservation for "${res.bookTitle}" status has been updated to: ${status.toUpperCase()}.`;
    if (status === 'approved') {
      msg = `Great news! Your reservation for "${res.bookTitle}" has been approved. Visit the library counter to collect your book.`;
    } else if (status === 'rejected') {
      msg = `Your reservation for "${res.bookTitle}" was rejected. Please speak with the librarian for further assistance.`;
    }
    await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      studentUid: res.studentUid,
      studentId: res.studentId,
      title: `Reservation ${status.toUpperCase()}`,
      message: msg,
      type: 'reservation',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  await logActivity({
    adminId: adminObj.uid,
    adminName: adminObj.name,
    action: 'Update Reservation',
    entity: 'Reservation',
    entityId: res.reservationId,
    details: `Changed reservation for "${res.bookTitle}" (Student: ${res.studentName}) to ${status}`,
  });
}

// ==================== FINES MANAGEMENT ====================
export async function getFines(): Promise<Fine[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.FINES));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Fine));
  } catch (e) {
    console.error('Failed to get fines:', e);
    return [];
  }
}

export async function markFineAsPaid(fineId: string, admin: { uid: string; name: string }): Promise<void> {
  const ref = doc(db, COLLECTIONS.FINES, fineId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Fine record not found');
  const fine = snap.data() as Fine;

  await updateDoc(ref, {
    status: 'paid',
    paidAt: new Date().toISOString(),
  });

  if (fine.studentUid) {
    await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      studentUid: fine.studentUid,
      studentId: fine.studentId,
      title: 'Fine Payment Received',
      message: `Your library fine of ₹${fine.amount} for "${fine.bookTitle}" has been marked as PAID. Receipt acknowledged.`,
      type: 'fine',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  await logActivity({
    adminId: admin.uid,
    adminName: admin.name,
    action: 'Mark Fine Paid',
    entity: 'Fine',
    entityId: fineId,
    details: `Cleared ₹${fine.amount} fine for ${fine.studentName} (Student ID: ${fine.studentId})`,
  });
}

export async function waiveFine(fineId: string, reason: string, admin: { uid: string; name: string }): Promise<void> {
  const ref = doc(db, COLLECTIONS.FINES, fineId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Fine record not found');
  const fine = snap.data() as Fine;

  await updateDoc(ref, {
    status: 'waived',
    waivedAt: new Date().toISOString(),
    notes: reason || 'Waived by librarian discretion',
  });

  if (fine.studentUid) {
    await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      studentUid: fine.studentUid,
      studentId: fine.studentId,
      title: 'Fine Waived',
      message: `Your fine of ₹${fine.amount} for "${fine.bookTitle}" was waived by the librarian. Reason: ${reason || 'Approved'}.`,
      type: 'fine',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  await logActivity({
    adminId: admin.uid,
    adminName: admin.name,
    action: 'Waive Fine',
    entity: 'Fine',
    entityId: fineId,
    details: `Waived ₹${fine.amount} fine for ${fine.studentName}. Reason: ${reason || 'Discretionary'}`,
  });
}

// Impose manual fine on a student
export async function imposeStudentFine(
  payload: {
    studentDocId?: string;
    studentId: string;
    studentName: string;
    rollNumber?: string;
    studentUid?: string;
    amount: number;
    reason: string;
    bookTitle?: string;
    notes?: string;
  },
  admin: { uid: string; name: string }
): Promise<string> {
  if (!payload.studentName || !payload.studentId) {
    throw new Error('Please select or specify a student to impose fine on.');
  }
  if (!payload.amount || payload.amount <= 0) {
    throw new Error('Fine amount must be greater than ₹0.');
  }

  const finesCol = collection(db, COLLECTIONS.FINES);
  const txnId = 'FINE-' + Math.floor(100000 + Math.random() * 900000);

  const docRef = await addDoc(finesCol, {
    issueId: 'MANUAL-' + Date.now(),
    transactionId: txnId,
    studentId: payload.studentId,
    studentUid: payload.studentUid || '',
    studentName: payload.studentName,
    rollNumber: payload.rollNumber || '',
    bookTitle: payload.bookTitle || payload.reason,
    amount: payload.amount,
    overdueDays: 0,
    status: 'unpaid',
    notes: payload.notes ? `${payload.reason}: ${payload.notes}` : payload.reason,
    createdAt: new Date().toISOString(),
  });

  await updateDoc(docRef, { id: docRef.id });

  if (payload.studentUid) {
    try {
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        studentUid: payload.studentUid,
        studentId: payload.studentId,
        title: 'Library Fine Imposed',
        message: `A fine of ₹${payload.amount} has been imposed for "${payload.reason}". ${payload.notes ? `Note: ${payload.notes}. ` : ''}Please pay at the library counter.`,
        type: 'fine',
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to send fine notification:', e);
    }
  }

  await logActivity({
    adminId: admin.uid,
    adminName: admin.name,
    action: 'Impose Fine',
    entity: 'Fine',
    entityId: docRef.id,
    details: `Imposed ₹${payload.amount} fine on ${payload.studentName} (${payload.studentId}) for "${payload.reason}"`,
  });

  return docRef.id;
}

// ==================== ISSUES & HISTORY ====================
export async function getAllIssues(): Promise<IssueTransaction[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.ISSUES));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as IssueTransaction));
  } catch (e) {
    console.error('Failed to get issues:', e);
    return [];
  }
}

export async function getIssuesByStudent(studentDocId: string): Promise<IssueTransaction[]> {
  try {
    const q = query(collection(db, COLLECTIONS.ISSUES), where('studentDocId', '==', studentDocId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as IssueTransaction));
  } catch (e) {
    console.error('Failed to get student issues:', e);
    return [];
  }
}

// ==================== ANNOUNCEMENTS ====================
export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.ANNOUNCEMENTS));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Announcement));
  } catch (e) {
    console.error('Failed to get announcements:', e);
    return [];
  }
}

export async function createAnnouncement(data: Omit<Announcement, 'id'>, admin?: { uid: string; name: string } | string): Promise<string> {
  const adminObj = typeof admin === 'string' ? { uid: 'admin', name: admin } : admin || { uid: 'admin', name: 'Chief Librarian' };
  const docRef = await addDoc(collection(db, COLLECTIONS.ANNOUNCEMENTS), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  await updateDoc(docRef, { id: docRef.id });

  await logActivity({
    adminId: adminObj.uid,
    adminName: adminObj.name,
    action: 'Create Announcement',
    entity: 'Announcement',
    entityId: docRef.id,
    details: `Published announcement: "${data.title}" (Priority: ${data.priority})`,
  });

  return docRef.id;
}

export async function deleteAnnouncement(id: string, admin: { uid: string; name: string }): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, id));
  await logActivity({
    adminId: admin.uid,
    adminName: admin.name,
    action: 'Delete Announcement',
    entity: 'Announcement',
    entityId: id,
    details: 'Removed announcement',
  });
}

// ==================== NOTIFICATIONS ====================
export async function getStudentNotifications(studentUid: string): Promise<LibraryNotification[]> {
  try {
    const q = query(collection(db, COLLECTIONS.NOTIFICATIONS), where('studentUid', '==', studentUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as LibraryNotification));
  } catch (e) {
    console.error('Failed to get notifications:', e);
    return [];
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { read: true });
}

export async function markAllNotificationsAsRead(studentUid: string): Promise<void> {
  const notifs = await getStudentNotifications(studentUid);
  const unread = notifs.filter((n) => !n.read);
  const batch = writeBatch(db);
  for (const n of unread) {
    batch.update(doc(db, COLLECTIONS.NOTIFICATIONS, n.id), { read: true });
  }
  await batch.commit();
}

// ==================== ACTIVITY LOGS ====================
export async function logActivity(log: {
  adminId: string;
  adminName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
}): Promise<void> {
  try {
    const now = new Date();
    await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), {
      ...log,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString(),
      timestamp: Date.now(),
    });
  } catch (err) {
    console.warn('Could not log activity:', err);
  }
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.ACTIVITY_LOGS));
    const logs = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ActivityLog));
    return logs.sort((a, b) => {
      const timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.date || a.timestamp || 0).getTime() || 0;
      const timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.date || b.timestamp || 0).getTime() || 0;
      return timeB - timeA;
    });
  } catch (e) {
    console.error('Failed to get activity logs:', e);
    return [];
  }
}

// ==================== CONVENIENCE WRAPPERS & ALIASES ====================
export const getAllFines = getFines;
export const getAllReservations = getReservations;
export const seedInitialLibraryData = seedFreshDemoData;

export async function getStudentIssues(studentIdOrUid: string): Promise<IssueTransaction[]> {
  const all = await getAllIssues();
  return all.filter(
    (i) => i.studentId === studentIdOrUid || i.studentUid === studentIdOrUid || i.studentDocId === studentIdOrUid
  );
}

export async function getStudentFines(studentIdOrUid: string): Promise<Fine[]> {
  const all = await getFines();
  return all.filter(
    (f) => f.studentId === studentIdOrUid || f.studentUid === studentIdOrUid
  );
}

export async function getStudentReservations(studentIdOrUid: string): Promise<Reservation[]> {
  const all = await getReservations();
  return all.filter(
    (r) => r.studentId === studentIdOrUid || r.studentUid === studentIdOrUid
  );
}

export async function updateStudentStatus(
  id: string,
  updates: Partial<Student>,
  adminName?: string
): Promise<void> {
  const admin = { uid: 'admin', name: adminName || 'Chief Librarian' };
  await updateStudent(id, updates, admin);
}

export async function adminUpdateStudent(
  id: string,
  updates: Partial<Student>,
  adminName?: string
): Promise<void> {
  const admin = { uid: 'admin', name: adminName || 'Chief Librarian' };
  await updateStudent(id, updates, admin);
}

export async function updateFineStatus(
  fineId: string,
  status: 'paid' | 'waived',
  reason?: string,
  adminName?: string
): Promise<void> {
  const admin = { uid: 'admin', name: adminName || 'Chief Librarian' };
  if (status === 'paid') {
    await markFineAsPaid(fineId, admin);
  } else {
    await waiveFine(fineId, reason || 'Waived by administrator', admin);
  }
}

