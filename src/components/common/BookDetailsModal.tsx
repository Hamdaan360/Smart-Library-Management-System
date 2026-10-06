import React, { useState } from 'react';
import { Book } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { createBookReservation } from '../../lib/libraryService';
import { StudentEbookReaderModal } from '../student/StudentEbookReaderModal';
import {
  X,
  CheckCircle2,
  BookmarkPlus,
  AlertCircle,
  MapPin,
  Building,
  Calendar,
  Layers,
  ShieldCheck,
  Loader2,
  BookOpen,
  FileText,
} from 'lucide-react';

interface Props {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStudentLogin?: () => void;
}

export const BookDetailsModal: React.FC<Props> = ({ book, isOpen, onClose, onOpenStudentLogin }) => {
  const { studentProfile, role } = useAuth();
  const [reserving, setReserving] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !book) return null;

  const isAvailable = book.availableCopies > 0;

  const handleReserve = async () => {
    if (!studentProfile) {
      if (onOpenStudentLogin) {
        onClose();
        onOpenStudentLogin();
      }
      return;
    }

    setReserving(true);
    setMessage(null);
    try {
      await createBookReservation({
        student: studentProfile,
        book,
        notes: 'Requested via online portal',
      });
      setMessage({
        type: 'success',
        text: `Reservation placed successfully! You will receive a notification when "${book.title}" is ready at the circulation counter.`,
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Could not place reservation.',
      });
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-600 uppercase tracking-wider text-white">
              {book.category}
            </span>
            <span className="text-xs font-mono text-slate-400">ID: {book.bookId}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {message && (
            <div
              className={`p-3.5 mb-4 rounded-xl text-xs flex items-start gap-2.5 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Book Cover */}
            <div className="sm:col-span-1">
              <div className="rounded-xl overflow-hidden shadow-md border border-slate-200 bg-slate-100 aspect-[3/4] relative">
                <img
                  src={book.coverImage && book.coverImage.trim() ? book.coverImage.trim() : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs ${
                      isAvailable ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {isAvailable ? `${book.availableCopies} Copies Available` : 'Currently Unavailable'}
                  </span>
                </div>
              </div>

              {/* Shelf & Location box */}
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-900" />
                  Library Shelf Location
                </div>
                <p className="font-mono text-blue-900 font-bold text-sm">{book.shelfNumber}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Central Wing, 2nd Floor Stacks</p>
              </div>

              {/* Digital E-Book Softcopy Badge & Quick Read */}
              {book.pdfUrl ? (
                <div className="mt-2.5 p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-xs">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-700" />
                      E-Book Softcopy
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-200/80 text-purple-800">
                      Available
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800 font-medium truncate">
                    {book.ebookFileName || 'Online Reading PDF'}
                    {book.ebookFileSize ? ` (${book.ebookFileSize})` : ''}
                  </p>
                  <button
                    type="button"
                    id="modal-btn-read-softcopy"
                    onClick={() => setShowReader(true)}
                    className="mt-2 w-full py-1.5 px-3 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Read Softcopy (PDF)
                  </button>
                </div>
              ) : null}
            </div>

            {/* Book Info */}
            <div className="sm:col-span-2 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">{book.title}</h3>
                <p className="text-sm font-semibold text-slate-700 mt-1">By {book.author}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Subject</span>
                    <span className="font-medium text-slate-800">{book.subject}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Publisher</span>
                    <span className="font-medium text-slate-800">{book.publisher}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Edition & Year</span>
                    <span className="font-medium text-slate-800">
                      {book.edition} ({book.publicationYear})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">ISBN</span>
                    <span className="font-mono text-slate-800">{book.isbn}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Description & Academic Scope
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">{book.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs text-slate-500">Holdings: </span>
                  <span className="font-bold text-xs text-slate-800">
                    {book.availableCopies} available / {book.totalCopies} total
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {book.pdfUrl && (
                    <button
                      type="button"
                      id="modal-btn-read-pdf-action"
                      onClick={() => setShowReader(true)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Read E-Book
                    </button>
                  )}

                  {role === 'admin' ? (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      Admin: Circulation Mode
                    </span>
                  ) : (
                    <button
                      onClick={handleReserve}
                      disabled={reserving}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                        isAvailable
                          ? 'bg-blue-900 hover:bg-blue-800 text-white'
                          : 'bg-indigo-900 hover:bg-indigo-800 text-white'
                      }`}
                    >
                      {reserving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <BookmarkPlus className="w-3.5 h-3.5" />
                      )}
                      {studentProfile
                        ? isAvailable
                          ? 'Request / Reserve Book'
                          : 'Join Waitlist / Reserve Book'
                        : 'Login to Reserve Book'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Digital Reader */}
      <StudentEbookReaderModal
        book={book}
        isOpen={showReader}
        onClose={() => setShowReader(false)}
      />
    </div>
  );
};
