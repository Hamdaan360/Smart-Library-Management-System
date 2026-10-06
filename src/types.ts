export interface Book {
  id: string; // Firestore document ID
  bookId: string; // e.g. "BK-1001"
  title: string;
  author: string;
  isbn: string;
  category: string;
  subject: string;
  publisher: string;
  edition: string;
  publicationYear: number;
  shelfNumber: string;
  description: string;
  coverImage: string;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
  pdfUrl?: string; // Direct PDF URL or base64 data URI for digital softcopy
  hasEbook?: boolean; // Flag indicating if softcopy is attached
  ebookFileName?: string; // Optional original name of uploaded PDF
  ebookFileSize?: string; // Formatted size e.g. "2.4 MB"
  createdAt: string;
  updatedAt: string;
}

export const STUDENT_STREAMS = [
  'FYJC Science',
  'FYJC Commerce',
  'SYJC Science',
  'SYJC Commerce',
  'B.Com',
  'B.M.S. Marketing',
  'B.M.S. Finance',
  'B.A.M.M.C.',
] as const;

export type StudentStream = typeof STUDENT_STREAMS[number];

export interface Student {
  id: string; // Firestore doc ID
  studentId: string; // e.g. "VVUC-2024-001"
  rollNumber: string; // e.g. "101"
  name: string;
  stream: StudentStream | string;
  classYear: string; // e.g. "FYJC", "SYJC", "FY", "SY", "TY"
  division: string; // e.g. "A", "B", "C", "D"
  email: string;
  mobile: string;
  profilePic?: string;
  isVerified?: boolean;
  verified?: boolean;
  accountStatus?: 'active' | 'blocked' | 'inactive';
  active?: boolean;
  uid?: string; // linked Firebase Auth UID
  registeredAt?: string;
  password?: string;
  isPhoneVerified?: boolean;
  phoneVerifiedAt?: string;
  lastLoginAt?: string;
  lastLoginMethod?: 'password' | 'otp';
  loginCount?: number;
}

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'librarian' | 'superadmin';
  createdAt: string;
  password?: string;
}

export interface IssueTransaction {
  id: string;
  transactionId: string; // e.g. "TXN-8742"
  studentId: string; // College student ID
  studentUid?: string; // Auth UID
  studentDocId: string;
  studentName: string;
  rollNumber: string;
  bookId: string; // Book ID code
  bookDocId: string;
  bookTitle: string;
  adminId: string;
  adminName: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  returnDate?: string | null; // YYYY-MM-DD
  status: 'issued' | 'returned' | 'overdue';
  fineAmount: number;
  overdueDays: number;
  returnedByAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  reservationId: string; // e.g. "RES-501"
  studentId: string;
  studentUid: string;
  studentName: string;
  bookId: string;
  bookDocId: string;
  bookTitle: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Fine {
  id: string;
  issueId: string;
  transactionId?: string;
  studentId: string;
  studentUid?: string;
  studentName: string;
  rollNumber: string;
  bookTitle: string;
  amount: number;
  overdueDays: number;
  status: 'unpaid' | 'paid' | 'waived';
  paidAt?: string;
  waivedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface LibraryNotification {
  id: string;
  studentUid: string;
  studentId: string;
  title: string;
  message: string;
  type: 'issue' | 'return' | 'due' | 'overdue' | 'reservation' | 'fine' | 'announcement';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'normal' | 'high' | 'urgent';
  createdDate?: string;
  expiryDate?: string;
  authorName?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface LibrarySettings {
  collegeName: string;
  libraryName: string;
  contact: string;
  email: string;
  openingHours: string;
  maxBooksPerStudent: number;
  defaultLoanDurationDays?: number;
  issuePeriodDays?: number;
  finePerDay: number;
  gracePeriodDays: number;
  maxFine: number;
  enableReservations?: boolean;
  reservationDurationDays?: number;
  address?: string;
}

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  performedBy?: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  date: string;
  time: string;
  timestamp: number | string;
}

export interface StudentAuthLog {
  id?: string;
  studentId: string;
  studentName: string;
  email: string;
  mobile: string;
  action: 'registration' | 'login';
  method: 'password' | 'otp' | 'credentials';
  status: 'success' | 'failed';
  ipDevice?: string;
  timestamp: string;
  details?: string;
}
