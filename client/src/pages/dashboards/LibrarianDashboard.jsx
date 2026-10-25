import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRightLeft, AlertTriangle, DollarSign, Database, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import KpiCard from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate, daysFromNow } from '../../lib/utils';
import api from '../../lib/api';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function LibrarianDashboard() {
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/library/books/stats'),
      api.get('/library/issues/overdue?limit=5'),
      api.get('/library/issues?limit=5&sort=desc'),
    ]).then(([sRes, oRes, iRes]) => {
      setStats(sRes.data);
      setOverdue(oRes.data.issues || oRes.data || []);
      setRecentIssues(iRes.data.issues || iRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const monthlyData = [
    { month: 'May', issues: 42 }, { month: 'Jun', issues: 58 },
    { month: 'Jul', issues: 35 }, { month: 'Aug', issues: 64 },
    { month: 'Sep', issues: 51 }, { month: 'Oct', issues: 47 },
  ];
  const categoryData = stats?.byCategory || [
    { name: 'CS', value: 18 }, { name: 'Electronics', value: 10 },
    { name: 'Math', value: 8 }, { name: 'Physics', value: 6 },
    { name: 'Management', value: 6 }, { name: 'Literature', value: 4 },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Library Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Overview of library operations</p>
        </div>
        <div className="flex gap-2">
          <Link to="/library/checkout" className="btn-primary btn-sm">Checkout Book</Link>
          <Link to="/library/return" className="btn-secondary btn-sm">Return Book</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Books" value={stats?.totalBooks || 0} icon={BookOpen} color="blue" />
        <KpiCard title="Total Copies" value={stats?.totalCopies || 0} icon={BookOpen} color="indigo" />
        <KpiCard title="Available" value={stats?.availableCopies || 0} icon={BookOpen} color="green" />
        <KpiCard title="Issued" value={stats?.activeIssues || 0} icon={ArrowRightLeft} color="blue" />
        <KpiCard title="Overdue" value={stats?.overdueCount || 0} icon={AlertTriangle} color="red" />
        <KpiCard title="Fines Pending" value={formatCurrency(stats?.pendingFines || 0)} icon={DollarSign} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Issue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="issues" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Issues" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Books by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overdue + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Overdue Books</h3>
            <Link to="/library/overdue" className="text-xs text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {overdue.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">No overdue books 🎉</p>
            ) : overdue.slice(0, 5).map((issue, i) => {
              const days = Math.abs(daysFromNow(issue.dueDate));
              return (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {issue.student?.user?.name || issue.bookCopy?.book?.title}
                    </p>
                    <p className="text-xs text-gray-400">{issue.bookCopy?.book?.title || ''}</p>
                  </div>
                  <span className="badge-red text-xs">{days} days</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Issues</h3>
            <Link to="/library/issues" className="text-xs text-primary-600 hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {recentIssues.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">No recent activity</p>
            ) : recentIssues.slice(0, 5).map((issue, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {issue.student?.user?.name || 'Student'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{issue.bookCopy?.book?.title}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={issue.returnedAt ? 'RETURNED' : 'ISSUED'} />
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(issue.issuedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
