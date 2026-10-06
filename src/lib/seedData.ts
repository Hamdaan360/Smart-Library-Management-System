import { Book, Student, LibrarySettings, Announcement, AdminUser } from '../types';

export const DEFAULT_LIBRARY_SETTINGS: LibrarySettings = {
  collegeName: 'Vidya Vikas Universal College',
  libraryName: 'VVUC Central Knowledge & Learning Resource Center',
  address: '1st Floor, Vidya Vikas Universal College, Chincholi Bunder, Malad (West), Mumbai - 400064',
  contact: '',
  email: 'v.v.u.c.library@gmail.com',
  openingHours: 'Mon – Sat: 8:00 AM – 5:00 PM',
  maxBooksPerStudent: 3,
  defaultLoanDurationDays: 14,
  finePerDay: 5,
  gracePeriodDays: 2,
  maxFine: 200,
  enableReservations: true,
  reservationDurationDays: 3,
};

export const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'admin-vvuc-super',
    uid: 'admin-hamdaan',
    email: 'hamdaanai360@gmail.com',
    name: 'Hamdaan (Chief Administrator)',
    role: 'superadmin',
    createdAt: new Date().toISOString(),
  },
];

// Empty list so no dummy students are seeded. College administration can add real students directly.
export const INITIAL_STUDENTS_ROSTER: Omit<Student, 'id'>[] = [];

// Empty list so no dummy books are seeded. College administration can add real library books directly.
export const INITIAL_BOOKS: Omit<Book, 'id'>[] = [];

export const INITIAL_ANNOUNCEMENTS: Omit<Announcement, 'id'>[] = [
  {
    title: 'Welcome to VVUC Central Library Resource Portal',
    message: 'Welcome students and faculty to the Vidya Vikas Universal College Library portal located on the 1st Floor, Chincholi Bunder campus. Browse library books, reserve items, and track your loans online.',
    priority: 'high',
    createdDate: new Date().toISOString().split('T')[0],
    expiryDate: '2026-12-31',
    authorName: 'VVUC Central Library Administration',
    createdAt: new Date().toISOString(),
  },
];
