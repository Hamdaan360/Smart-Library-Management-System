import React, { useState, useMemo } from 'react';
import { IssueTransaction } from '../../types';
import { Search, Filter, History, Download, ArrowUpDown } from 'lucide-react';

interface Props {
  issues: IssueTransaction[];
}

export const BorrowingHistory: React.FC<Props> = ({ issues }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'returned' | 'overdue'>('all');

  const filteredHistory = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return issues.filter((item) => {
      const matchSearch =
        !term ||
        item.bookTitle.toLowerCase().includes(term) ||
        item.transactionId.toLowerCase().includes(term) ||
        item.bookId.toLowerCase().includes(term);

      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [issues, searchTerm, statusFilter]);

  const exportHistoryCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = ['Transaction ID', 'Book Title', 'Book Code', 'Issue Date', 'Due Date', 'Return Date', 'Status', 'Fine Amount (INR)'];
    const rows = filteredHistory.map((item) => [
      item.transactionId,
      `"${item.bookTitle.replace(/"/g, '""')}"`,
      item.bookId,
      item.issueDate,
      item.dueDate,
      item.returnDate || 'N/A',
      item.status.toUpperCase(),
      item.fineAmount || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Borrowing_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Borrowing History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lifetime record of all library book loans, return dates, and fine assessments
          </p>
        </div>
        <button
          onClick={exportHistoryCSV}
          disabled={filteredHistory.length === 0}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV History
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Book Title, Transaction ID (e.g. TXN-1002), or Book ID..."
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Statuses ({issues.length})</option>
            <option value="issued">Currently Issued</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No borrowing transactions found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {issues.length === 0
                ? "You haven't borrowed any library books yet."
                : 'No transactions match your search filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Transaction ID</th>
                  <th className="p-3.5">Book Details</th>
                  <th className="p-3.5">Issue Date</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Return Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((item) => {
                  const isOverdue = item.status === 'overdue';
                  const isReturned = item.status === 'returned';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-slate-700 font-bold">{item.transactionId}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{item.bookTitle}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Code: {item.bookId}</p>
                      </td>
                      <td className="p-3.5 text-slate-600">{item.issueDate}</td>
                      <td className="p-3.5 text-slate-600 font-medium">{item.dueDate}</td>
                      <td className="p-3.5 text-slate-600">
                        {item.returnDate ? (
                          <span className="text-emerald-800 font-medium">{item.returnDate}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not returned yet</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isReturned
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-bold">
                        {item.fineAmount && item.fineAmount > 0 ? (
                          <span className="text-rose-700">₹{item.fineAmount}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">₹0</span>
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
