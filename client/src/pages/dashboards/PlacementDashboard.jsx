import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, CheckCircle, TrendingUp, Building2, CalendarDays, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import KpiCard from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate, formatCurrency } from '../../lib/utils';
import api from '../../lib/api';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PlacementDashboard() {
  const [stats, setStats] = useState(null);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/placement/summary'),
      api.get('/placement/drives?status=UPCOMING&limit=6'),
    ]).then(([sRes, dRes]) => {
      setStats(sRes.data);
      setDrives(dRes.data.data || dRes.data.drives || dRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const branchData = stats?.branchWise || [];
  const companyData = stats?.companyWise?.slice(0, 6) || [];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Placement Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Training & Placement Cell — Batch 2024</p>
        </div>
        <div className="flex gap-2">
          <Link to="/placement/drives" className="btn-primary btn-sm">Create Drive</Link>
          <Link to="/reports/placement" className="btn-secondary btn-sm">View Reports</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Drives" value={stats?.totalDrives || 0} icon={Briefcase} color="blue" />
        <KpiCard title="Total Applications" value={stats?.totalApplications || 0} icon={Users} color="indigo" />
        <KpiCard title="Students Placed" value={stats?.totalPlaced || 0} icon={CheckCircle} color="green" trend={12} />
        <KpiCard title="Placement %" value={`${stats?.placementPercentage || 0}%`} icon={TrendingUp} color="purple" />
        <KpiCard title="Avg CTC" value={`₹${stats?.avgCtc || 0} LPA`} icon={TrendingUp} color="amber" />
        <KpiCard title="Highest CTC" value={`₹${stats?.highestCtc || 0} LPA`} icon={TrendingUp} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Company-wise Selections</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={companyData} barSize={24} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="company" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="selected" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Selected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Branch-wise Placement</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={branchData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="placed">
                {branchData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n, p) => [v, p.payload.branch]} />
              <Legend iconType="circle" iconSize={10} formatter={(v, e) => e.payload.branch} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Drives */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Drives</h3>
          <Link to="/placement/drives" className="text-xs text-primary-600 hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr>
              <th>Company</th><th>Role</th><th>CTC (LPA)</th><th>Drive Date</th><th>Last Date</th><th>Batch</th><th>Status</th>
            </tr></thead>
            <tbody>
              {drives.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No upcoming drives</td></tr>
              ) : drives.map(d => (
                <tr key={d.id}>
                  <td className="font-medium">{d.company?.name}</td>
                  <td>{d.role}</td>
                  <td>₹{d.ctc}</td>
                  <td>{formatDate(d.driveDate)}</td>
                  <td>{formatDate(d.lastDateApply)}</td>
                  <td>{d.batchYear}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
