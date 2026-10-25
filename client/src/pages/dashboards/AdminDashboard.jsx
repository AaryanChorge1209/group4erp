import { useState, useEffect } from 'react';
import { BookOpen, BookMarked, AlertTriangle, DollarSign, Users, Briefcase, ArrowRightLeft, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import KpiCard from '../../components/ui/KpiCard';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import api from '../../lib/api';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [libStats, setLibStats] = useState(null);
  const [placementStats, setPlacementStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/library/books/stats'),
      api.get('/reports/placement/summary'),
      api.get('/admin/audit-logs?limit=8'),
    ]).then(([libRes, plRes, logRes]) => {
      setLibStats(libRes.data);
      setPlacementStats(plRes.data);
      setAuditLogs(logRes.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Mock chart data (real data from stats)
  const issueData = [
    { month: 'May', issues: 45 }, { month: 'Jun', issues: 52 },
    { month: 'Jul', issues: 38 }, { month: 'Aug', issues: 61 },
    { month: 'Sep', issues: 55 }, { month: 'Oct', issues: 48 },
  ];
  const branchData = [
    { name: 'CSE', value: 12 }, { name: 'ECE', value: 8 },
    { name: 'MECH', value: 6 }, { name: 'IT', value: 4 },
    { name: 'CIVIL', value: 2 }, { name: 'EEE', value: 1 },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">VVIT College of Engineering — Academic Year 2024-25</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Books" value={libStats?.totalBooks || 0} icon={BookOpen} color="blue" trend={5} />
        <KpiCard title="Active Issues" value={libStats?.activeIssues || 0} icon={ArrowRightLeft} color="indigo" />
        <KpiCard title="Overdue" value={libStats?.overdueCount || 0} icon={AlertTriangle} color="red" />
        <KpiCard title="Fines Pending" value={formatCurrency(libStats?.pendingFines || 0)} icon={DollarSign} color="amber" />
        <KpiCard title="Total Drives" value={placementStats?.totalDrives || 0} icon={Briefcase} color="green" />
        <KpiCard title="Students Placed" value={placementStats?.totalPlaced || 0} icon={Users} color="purple" trend={12} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Book Issues</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={issueData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="issues" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Issues" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Students by Branch</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={branchData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {branchData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit log + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No recent activity</div>
            ) : auditLogs.map((log, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-600 text-xs font-bold">
                    {log.user?.name?.[0] || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-medium">{log.user?.name || 'System'}</span>{' '}
                    <span className="text-gray-500">{log.action} {log.entity}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: 'Add New User', to: '/admin/users', color: 'bg-purple-600' },
              { label: 'Add Book to Catalog', to: '/library/books', color: 'bg-blue-600' },
              { label: 'Create Drive', to: '/placement/drives', color: 'bg-green-600' },
              { label: 'View Overdue Books', to: '/library/overdue', color: 'bg-red-600' },
              { label: 'System Settings', to: '/admin/settings', color: 'bg-gray-600' },
            ].map(a => (
              <a key={a.label} href={a.to} className={`block w-full text-center text-white text-sm font-medium py-2.5 rounded-lg ${a.color} hover:opacity-90 transition-opacity`}>
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
