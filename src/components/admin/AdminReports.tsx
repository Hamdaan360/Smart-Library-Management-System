import React, { useMemo, useState } from 'react';
import { Book, Student, IssueTransaction, Fine } from '../../types';
import {
  BarChart3,
  Download,
  BookOpen,
  AlertTriangle,
  Receipt,
  Users,
  TrendingUp,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';

interface Props {
  books: Book[];
  students: Student[];
  issues: IssueTransaction[];
  fines: Fine[];
}

export const AdminReports: React.FC<Props> = ({ books, students, issues, fines }) => {
  const [activeReport, setActiveReport] = useState<'most-borrowed' | 'overdue' | 'fines' | 'student-activity'>('most-borrowed');

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Most Borrowed Books calculation
  const mostBorrowed = useMemo(() => {
    const countMap: Record<string, { book: Book; count: number }> = {};

    issues.forEach((iss) => {
      const b = books.find((x) => x.bookId === iss.bookId) || {
        id: iss.bookId,
        title: iss.bookTitle,
        bookId: iss.bookId,
        author: 'Unknown',
        category: 'General',
        totalCopies: 1,
        availableCopies: 0,
      } as Book;

      if (!countMap[iss.bookId]) {
        countMap[iss.bookId] = { book: b, count: 0 };
      }
      countMap[iss.bookId].count += 1;
    });

    return Object.values(countMap).sort((a, b) => b.count - a.count);
  }, [issues, books]);

  // 2. Overdue Books calculation
  const overdueList = useMemo(() => {
    return issues.filter(
      (i) => i.status === 'overdue' || (i.dueDate < todayStr && i.status !== 'returned')
    );
  }, [issues, todayStr]);

  // 3. Student Borrowing Activity calculation
  const studentActivity = useMemo(() => {
    const map: Record<string, { studentName: string; studentId: string; totalIssued: number; overdueCount: number }> = {};

    issues.forEach((iss) => {
      if (!map[iss.studentId]) {
        map[iss.studentId] = {
          studentName: iss.studentName,
          studentId: iss.studentId,
          totalIssued: 0,
          overdueCount: 0,
        };
      }
      map[iss.studentId].totalIssued += 1;
      if (iss.status === 'overdue' || (iss.dueDate < todayStr && iss.status !== 'returned')) {
        map[iss.studentId].overdueCount += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.totalIssued - a.totalIssued);
  }, [issues, todayStr]);

  // Export handlers
  const exportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let fileName = `Library_Report_${activeReport}_${todayStr}.csv`;

    if (activeReport === 'most-borrowed') {
      headers = ['Rank', 'Book ID', 'Title', 'Author', 'Category', 'Times Borrowed'];
      rows = mostBorrowed.map((item, idx) => [
        idx + 1,
        item.book.bookId,
        `"${item.book.title.replace(/"/g, '""')}"`,
        `"${item.book.author.replace(/"/g, '""')}"`,
        item.book.category,
        item.count,
      ]);
    } else if (activeReport === 'overdue') {
      headers = ['Transaction ID', 'Student ID', 'Student Name', 'Book ID', 'Book Title', 'Issue Date', 'Due Date'];
      rows = overdueList.map((item) => [
        item.transactionId,
        item.studentId,
        `"${item.studentName}"`,
        item.bookId,
        `"${item.bookTitle.replace(/"/g, '""')}"`,
        item.issueDate,
        item.dueDate,
      ]);
    } else if (activeReport === 'fines') {
      headers = ['Fine ID', 'Student ID', 'Student Name', 'Book Title', 'Amount (INR)', 'Overdue Days', 'Status'];
      rows = fines.map((f) => [
        f.id,
        f.studentId,
        `"${f.studentName}"`,
        `"${f.bookTitle.replace(/"/g, '""')}"`,
        f.amount,
        f.overdueDays,
        f.status.toUpperCase(),
      ]);
    } else {
      headers = ['Student ID', 'Student Name', 'Total Books Borrowed', 'Currently Overdue'];
      rows = studentActivity.map((s) => [
        s.studentId,
        `"${s.studentName}"`,
        s.totalIssued,
        s.overdueCount,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    let data: any = {};
    if (activeReport === 'most-borrowed') data = mostBorrowed;
    else if (activeReport === 'overdue') data = overdueList;
    else if (activeReport === 'fines') data = fines;
    else data = studentActivity;

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `Library_Report_${activeReport}_${todayStr}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Analytics & Circulation Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical breakdown of library utilization, collection turnover, and compliance metrics
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={exportJSON}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveReport('most-borrowed')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeReport === 'most-borrowed'
              ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">
              {mostBorrowed.length > 0 ? mostBorrowed[0].count : 0} Max
            </span>
          </div>
          <p className="font-bold text-sm">Most Borrowed Books</p>
          <p
            className={`text-[10px] mt-0.5 ${
              activeReport === 'most-borrowed' ? 'text-blue-200' : 'text-slate-400'
            }`}
          >
            High demand curriculum titles
          </p>
        </button>

        <button
          onClick={() => setActiveReport('overdue')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeReport === 'overdue'
              ? 'bg-rose-900 text-white border-rose-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">{overdueList.length} Items</span>
          </div>
          <p className="font-bold text-sm">Overdue Books Report</p>
          <p
            className={`text-[10px] mt-0.5 ${
              activeReport === 'overdue' ? 'text-rose-200' : 'text-slate-400'
            }`}
          >
            Titles past their return deadline
          </p>
        </button>

        <button
          onClick={() => setActiveReport('fines')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeReport === 'fines'
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Receipt className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">₹{fines.reduce((acc, f) => acc + (f.amount || 0), 0)}</span>
          </div>
          <p className="font-bold text-sm">Fine Collection Report</p>
          <p
            className={`text-[10px] mt-0.5 ${
              activeReport === 'fines' ? 'text-emerald-200' : 'text-slate-400'
            }`}
          >
            Total assessed, paid, and waived
          </p>
        </button>

        <button
          onClick={() => setActiveReport('student-activity')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeReport === 'student-activity'
              ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">{studentActivity.length} Active</span>
          </div>
          <p className="font-bold text-sm">Student Borrowing Activity</p>
          <p
            className={`text-[10px] mt-0.5 ${
              activeReport === 'student-activity' ? 'text-indigo-200' : 'text-slate-400'
            }`}
          >
            Engagement by student ID
          </p>
        </button>
      </div>

      {/* Selected Report Content */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {activeReport === 'most-borrowed' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Rank</th>
                  <th className="p-3.5">Book Code</th>
                  <th className="p-3.5">Title & Author</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Circulation Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mostBorrowed.map((item, idx) => (
                  <tr key={item.book.bookId} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-3.5 font-mono text-slate-700 font-bold">{item.book.bookId}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{item.book.title}</p>
                      <p className="text-[10px] text-slate-500">{item.book.author}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-semibold text-[10px]">
                        {item.book.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-black text-blue-900 text-sm">
                      {item.count} loans
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'overdue' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Txn ID</th>
                  <th className="p-3.5">Student Member</th>
                  <th className="p-3.5">Book Title</th>
                  <th className="p-3.5">Issue Date</th>
                  <th className="p-3.5">Strict Due Date</th>
                  <th className="p-3.5 text-right">Overdue Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                      No overdue books currently recorded.
                    </td>
                  </tr>
                ) : (
                  overdueList.map((item) => {
                    const dueTime = new Date(item.dueDate).getTime();
                    const nowTime = new Date(todayStr).getTime();
                    const days = Math.max(1, Math.floor((nowTime - dueTime) / (1000 * 60 * 60 * 24)));

                    return (
                      <tr key={item.id} className="hover:bg-rose-50/40">
                        <td className="p-3.5 font-mono font-bold text-rose-800">{item.transactionId}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{item.studentName}</p>
                          <p className="text-[10px] font-mono text-slate-500">{item.studentId}</p>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800">{item.bookTitle}</td>
                        <td className="p-3.5 text-slate-600">{item.issueDate}</td>
                        <td className="p-3.5 font-bold text-rose-900">{item.dueDate}</td>
                        <td className="p-3.5 text-right font-black text-rose-700">{days} days</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'fines' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Book Title</th>
                  <th className="p-3.5">Overdue Days</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{f.studentName}</p>
                      <p className="text-[10px] font-mono text-slate-500">{f.studentId}</p>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{f.bookTitle}</td>
                    <td className="p-3.5 text-slate-600">{f.overdueDays} days</td>
                    <td className="p-3.5 font-black text-slate-900">₹{f.amount}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          f.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : f.status === 'waived'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {f.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'student-activity' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Student ID</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5 text-center">Total Books Borrowed</th>
                  <th className="p-3.5 text-right">Currently Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentActivity.map((s) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/80">
                    <td className="p-3.5 font-mono font-bold text-blue-950">{s.studentId}</td>
                    <td className="p-3.5 font-bold text-slate-900">{s.studentName}</td>
                    <td className="p-3.5 text-center font-bold text-slate-800">{s.totalIssued} titles</td>
                    <td className="p-3.5 text-right">
                      {s.overdueCount > 0 ? (
                        <span className="font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          {s.overdueCount} Overdue
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">Clean (0)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
