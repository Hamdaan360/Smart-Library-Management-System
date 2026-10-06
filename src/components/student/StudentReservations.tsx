import React from 'react';
import { Reservation } from '../../types';
import { BookmarkCheck, Clock, CheckCircle2, XCircle, Ban, BookOpen } from 'lucide-react';

interface Props {
  reservations: Reservation[];
  onBrowseBooks: () => void;
}

export const StudentReservations: React.FC<Props> = ({ reservations, onBrowseBooks }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Book Reservations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track waitlist requests and hold queues for high-demand or checked-out textbooks
          </p>
        </div>
        <button
          onClick={onBrowseBooks}
          className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors self-start sm:self-auto shadow-2xs"
        >
          Reserve Another Book
        </button>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {reservations.length === 0 ? (
          <div className="p-12 text-center">
            <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No active book reservations</h3>
            <p className="text-xs text-slate-500 mt-1">
              When a textbook is currently out of stock, you can place a reservation to receive it as soon as another student returns a copy.
            </p>
            <button
              onClick={onBrowseBooks}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-50 text-blue-900 text-xs font-semibold hover:bg-blue-100 transition-colors"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Reservation ID</th>
                  <th className="p-3.5">Book Title</th>
                  <th className="p-3.5">Book Code</th>
                  <th className="p-3.5">Request Date</th>
                  <th className="p-3.5">Current Status</th>
                  <th className="p-3.5">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.map((res) => {
                  const isApproved = res.status === 'approved';
                  const isPending = res.status === 'pending';
                  const isFulfilled = res.status === 'fulfilled';
                  const isRejected = res.status === 'rejected';

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-mono font-bold text-slate-700">{res.reservationId}</td>
                      <td className="p-3.5 font-bold text-slate-900">{res.bookTitle}</td>
                      <td className="p-3.5 font-mono text-slate-500">{res.bookId}</td>
                      <td className="p-3.5 text-slate-600">{res.requestDate}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isFulfilled
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {res.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {isApproved ? (
                          <span className="font-semibold text-emerald-700">
                            Book ready! Visit counter within 3 days to collect.
                          </span>
                        ) : isPending ? (
                          <span className="text-slate-500">In queue. You will be notified on return.</span>
                        ) : isFulfilled ? (
                          <span className="text-blue-700">Collected and issued to you.</span>
                        ) : (
                          <span className="text-rose-600">Request could not be accommodated.</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
