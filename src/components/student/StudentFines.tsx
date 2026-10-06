import React from 'react';
import { Fine, LibrarySettings } from '../../types';
import { Receipt, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

interface Props {
  fines: Fine[];
  settings?: LibrarySettings | null;
}

export const StudentFines: React.FC<Props> = ({ fines, settings }) => {
  const unpaidFines = fines.filter((f) => f.status === 'unpaid');
  const paidFines = fines.filter((f) => f.status === 'paid');
  const waivedFines = fines.filter((f) => f.status === 'waived');

  const totalUnpaidAmount = unpaidFines.reduce((acc, f) => acc + (f.amount || 0), 0);

  const finePerDay = settings?.finePerDay ?? 5;
  const gracePeriod = settings?.gracePeriodDays ?? 2;
  const maxFine = settings?.maxFine ?? 200;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Library Fines & Dues</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View outstanding overdue penalties, clearance receipts, and library fine policies
          </p>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pending Dues</p>
            <p className="text-lg font-black text-rose-700">₹{totalUnpaidAmount}</p>
          </div>
        </div>
      </div>

      {/* Transparent Fine Formula Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> College Fine Calculation Formula & Policy
        </h3>
        <p className="text-xs text-slate-300">
          <strong className="text-white">Fine = Applicable Overdue Days × ₹{finePerDay} / day</strong> (Subject to a maximum cap of ₹{maxFine} per book).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-400">
          <div className="bg-white/5 p-2 rounded-lg">
            Daily Overdue Charge: <strong className="text-white">₹{finePerDay} / day</strong>
          </div>
          <div className="bg-white/5 p-2 rounded-lg">
            Grace Period: <strong className="text-white">{gracePeriod} days</strong>
          </div>
          <div className="bg-white/5 p-2 rounded-lg">
            Maximum Fine Cap: <strong className="text-white">₹{maxFine} / book</strong>
          </div>
        </div>
      </div>

      {/* Fines Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {fines.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Clear Record! No Fines</h3>
            <p className="text-xs text-slate-500 mt-1">
              You do not have any library fines or pending overdue fees on your account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Transaction</th>
                  <th className="p-3.5">Book Title</th>
                  <th className="p-3.5">Overdue Days</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Fine Status</th>
                  <th className="p-3.5">Resolution Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map((fine) => {
                  const isPaid = fine.status === 'paid';
                  const isWaived = fine.status === 'waived';
                  const isUnpaid = fine.status === 'unpaid';

                  return (
                    <tr key={fine.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-mono text-slate-600 font-semibold">
                        {fine.transactionId || fine.issueId.substring(0, 8)}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{fine.bookTitle}</td>
                      <td className="p-3.5 text-slate-600">{fine.overdueDays} days</td>
                      <td className="p-3.5 font-extrabold text-sm">
                        <span className={isUnpaid ? 'text-rose-700' : 'text-slate-700'}>
                          ₹{fine.amount}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : isWaived
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {fine.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {isPaid && fine.paidAt ? (
                          <span className="text-emerald-700">Paid on {String(fine.paidAt).split('T')[0]}</span>
                        ) : isWaived ? (
                          <span className="text-blue-700">{fine.notes || 'Waived by Librarian'}</span>
                        ) : (
                          <span className="text-rose-600 font-medium">Please pay at circulation desk</span>
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
