import React, { useState } from 'react';
import { IssueTransaction, Book } from '../../types';
import { BookMarked, CheckCircle2, AlertTriangle, Clock, Calendar, ShieldAlert, FileText, BookOpen } from 'lucide-react';

interface Props {
  issues: IssueTransaction[];
  books?: Book[];
  onBrowseBooks: () => void;
  onReadEbook?: (book: Book) => void;
}

export const StudentMyBooks: React.FC<Props> = ({ issues, books = [], onBrowseBooks, onReadEbook }) => {
  const [activeSubTab, setActiveSubTab] = useState<'issued' | 'returned' | 'overdue'>('issued');

  const today = new Date().toISOString().split('T')[0];

  const currentlyIssued = issues.filter(
    (i) => i.status === 'issued' && i.dueDate >= today
  );

  const returnedBooks = issues.filter((i) => i.status === 'returned');

  const overdueBooks = issues.filter(
    (i) => i.status === 'overdue' || (i.dueDate < today && i.status !== 'returned')
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Borrowed Books</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor active loans, track return deadlines, and review returned library volumes
          </p>
        </div>
        <button
          onClick={onBrowseBooks}
          className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors self-start sm:self-auto shadow-2xs"
        >
          Browse More Books
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('issued')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'issued'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          Currently Issued
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-extrabold">
            {currentlyIssued.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('overdue')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'overdue'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          Overdue
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              overdueBooks.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {overdueBooks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('returned')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'returned'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Returned
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">
            {returnedBooks.length}
          </span>
        </button>
      </div>

      {/* Info notice: only admins can mark returned */}
      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>Library Circulation Policy:</strong> Books must be physically returned to the library circulation counter where the librarian confirms and scans the volume.
        </span>
      </div>

      {/* Content for Currently Issued */}
      {activeSubTab === 'issued' && (
        <div className="space-y-4">
          {currentlyIssued.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No active books currently issued</h3>
              <p className="text-xs text-slate-500 mt-1">
                You have returned all borrowed textbooks. Visit the catalog to borrow new titles.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentlyIssued.map((item) => {
                const dueTime = new Date(item.dueDate).getTime();
                const nowTime = new Date(today).getTime();
                const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));

                const matchedBook = books.find(
                  (b) =>
                    b.id === item.bookId ||
                    b.bookId === item.bookId ||
                    b.title.toLowerCase().trim() === item.bookTitle.toLowerCase().trim()
                );

                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                          {item.transactionId}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {matchedBook?.pdfUrl && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              <FileText className="w-2.5 h-2.5" /> E-Book PDF
                            </span>
                          )}
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                            Active Loan
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{item.bookTitle}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Book Code: {item.bookId}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Issue Date:</span>
                        <span className="font-medium text-slate-800">{item.issueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Due Date:</span>
                        <span className="font-bold text-blue-950">{item.dueDate}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Days Remaining:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {diffDays} days
                        </span>
                      </div>
                    </div>

                    {matchedBook && onReadEbook && (
                      <button
                        type="button"
                        onClick={() => onReadEbook(matchedBook)}
                        className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Read Digital Softcopy (E-Book)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content for Overdue */}
      {activeSubTab === 'overdue' && (
        <div className="space-y-4">
          {overdueBooks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Great job! No overdue books</h3>
              <p className="text-xs text-slate-500 mt-1">
                You do not have any overdue volumes or pending overdue penalty days.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overdueBooks.map((item) => {
                const dueTime = new Date(item.dueDate).getTime();
                const nowTime = new Date(today).getTime();
                const overdueDays = Math.max(1, Math.floor((nowTime - dueTime) / (1000 * 60 * 60 * 24)));
                const matchedBook = books.find(
                  (b) =>
                    b.id === item.bookId ||
                    b.bookId === item.bookId ||
                    b.title.toLowerCase().trim() === item.bookTitle.toLowerCase().trim()
                );

                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-2xl border-2 border-rose-300 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          {item.transactionId}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                          OVERDUE ({overdueDays} Days)
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{item.bookTitle}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Book Code: {item.bookId}</p>
                    </div>

                    <div className="p-3 bg-rose-50/70 rounded-xl space-y-2 text-xs border border-rose-100">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Issue Date:</span>
                        <span className="font-medium text-slate-800">{item.issueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-800 font-semibold">Strict Due Date:</span>
                        <span className="font-bold text-rose-900">{item.dueDate}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-rose-200/80">
                        <span className="text-rose-800 font-bold">Days Overdue:</span>
                        <span className="font-extrabold text-rose-700">{overdueDays} days</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-rose-700 font-medium">
                      Please return this book to the circulation desk immediately to halt fine accrual.
                    </p>

                    {matchedBook && onReadEbook && (
                      <button
                        type="button"
                        onClick={() => onReadEbook(matchedBook)}
                        className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Read Digital Softcopy (E-Book)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Content for Returned */}
      {activeSubTab === 'returned' && (
        <div className="space-y-4">
          {returnedBooks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No returned books yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Completed return receipts will appear here once the librarian processes them.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Transaction ID</th>
                      <th className="p-3.5">Book Title</th>
                      <th className="p-3.5">Issue Date</th>
                      <th className="p-3.5">Due Date</th>
                      <th className="p-3.5">Return Date</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returnedBooks.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-mono text-slate-600 font-bold">{item.transactionId}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{item.bookTitle}</td>
                        <td className="p-3.5 text-slate-600">{item.issueDate}</td>
                        <td className="p-3.5 text-slate-600">{item.dueDate}</td>
                        <td className="p-3.5 font-medium text-emerald-800">{item.returnDate || 'Completed'}</td>
                        <td className="p-3.5">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Returned
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
