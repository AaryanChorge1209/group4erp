import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, AlertTriangle, DollarSign, BookCopy, Briefcase, Loader2 } from 'lucide-react';
import KpiCard from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate, daysFromNow } from '../../lib/utils';
import api from '../../lib/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ books: [], fines: {}, reservations: [], applications: [], drives: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.studentId) { setLoading(false); return; }
    const sid = user.studentId;
    Promise.all([
      api.get(`/students/${sid}/issued-books`),
      api.get(`/students/${sid}/fines`),
      api.get(`/students/${sid}/reservations`),
      api.get(`/students/${sid}/applications`),
      api.get('/placement/drives?status=UPCOMING&limit=5'),
    ]).then(([bRes, fRes, rRes, aRes, dRes]) => {
      setData({
        books: bRes.data.issues || bRes.data || [],
        fines: fRes.data || {},
        reservations: rRes.data.reservations || rRes.data || [],
        applications: aRes.data.applications || aRes.data || [],
        drives: dRes.data.drives || dRes.data || [],
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const overdueBooks = data.books.filter(b => new Date(b.dueDate) < new Date());

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back, {user?.name?.split(' ')[0]}!</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard title="Books Issued" value={data.books.length} icon={BookOpen} color="blue" />
        <KpiCard title="Overdue" value={overdueBooks.length} icon={AlertTriangle} color={overdueBooks.length > 0 ? 'red' : 'green'} />
        <KpiCard title="Fines Due" value={formatCurrency(data.fines.pendingAmount || 0)} icon={DollarSign} color="amber" />
        <KpiCard title="Reservations" value={data.reservations.filter(r => r.status === 'PENDING').length} icon={BookCopy} color="indigo" />
        <KpiCard title="Applications" value={data.applications.length} icon={Briefcase} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Current Books */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">My Issued Books</h3>
            <Link to="/student/books" className="text-xs text-primary-600 hover:underline">View All</Link>
          </div>
          {data.books.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No books currently issued</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {data.books.slice(0, 5).map((issue, i) => {
                const days = daysFromNow(issue.dueDate);
                const isOverdue = days < 0;
                return (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <div className={`w-2 h-10 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-500' : days <= 2 ? 'bg-amber-500' : 'bg-green-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{issue.bookCopy?.book?.title}</p>
                      <p className="text-xs text-gray-400">Due: {formatDate(issue.dueDate)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : days <= 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {isOverdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Drives */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Drives</h3>
            <Link to="/placement/drives" className="text-xs text-primary-600 hover:underline">View All</Link>
          </div>
          {data.drives.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No upcoming drives</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {data.drives.slice(0, 5).map((drive, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{drive.company?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{drive.role} • ₹{drive.ctc} LPA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Apply by</p>
                    <p className="text-xs font-medium text-amber-600">{formatDate(drive.lastDateApply)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fine alert */}
      {(data.fines.pendingAmount || 0) > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-200">Outstanding Library Fine</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">You have a pending fine of {formatCurrency(data.fines.pendingAmount)}. Please clear it to continue borrowing books.</p>
          </div>
          <Link to="/student/fines" className="btn bg-amber-600 text-white hover:bg-amber-700 btn-sm">View Fines</Link>
        </div>
      )}
    </div>
  );
}
