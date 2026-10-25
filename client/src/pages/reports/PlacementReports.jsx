import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, Download } from 'lucide-react';
import KpiCard from '../../components/ui/KpiCard';
import { Briefcase, Users, TrendingUp, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PlacementReports() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('summary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/placement/summary'),
      api.get('/reports/placement/company-wise'),
    ]).then(([sRes, cRes]) => {
      setStats({ ...sRes.data, companyReport: cRes.data.report || cRes.data || [] });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Placement Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Comprehensive analytics and export</p>
        </div>
        <button onClick={() => window.open('/api/reports/placement/summary?export=csv', '_blank')} className="btn-secondary btn-sm gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Drives" value={stats?.totalDrives || 0} icon={Briefcase} color="blue" />
        <KpiCard title="Placed" value={stats?.totalPlaced || 0} icon={CheckCircle} color="green" />
        <KpiCard title="Avg CTC" value={`₹${stats?.avgCtc || 0} LPA`} icon={TrendingUp} color="amber" />
        <KpiCard title="Highest CTC" value={`₹${stats?.highestCtc || 0} LPA`} icon={TrendingUp} color="purple" />
      </div>

      <div className="border-b border-gray-200 dark:border-slate-700 flex gap-1">
        {[['summary','Summary'],['company','Company-wise'],['branch','Branch-wise']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={tab === k ? 'tab-active' : 'tab-inactive'}>{l}</button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Company-wise Selections</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={(stats?.companyWise || []).slice(0, 8)} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="company" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="selected" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Selected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Branch-wise Placement</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats?.branchWise || []} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="placed">
                  {(stats?.branchWise || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n, p) => [v, p.payload.branch]} />
                <Legend iconType="circle" iconSize={10} formatter={(v, e) => e.payload.branch} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'company' && (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Company</th><th>Role</th><th>CTC (LPA)</th><th>Applications</th><th>Selected</th><th>Batch</th></tr></thead>
            <tbody>
              {(stats?.companyReport || []).map((row, i) => (
                <tr key={i}>
                  <td className="font-medium">{row.company}</td>
                  <td>{row.role}</td>
                  <td className="font-semibold text-green-600">₹{row.ctc}</td>
                  <td>{row.applications}</td>
                  <td><span className="badge-green">{row.selected}</span></td>
                  <td>{row.batch}</td>
                </tr>
              ))}
              {!(stats?.companyReport || []).length && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No data</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'branch' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stats?.branchWise || []).map(b => (
            <div key={b.branch} className="card p-5 text-center">
              <span className="badge-indigo text-sm mb-3">{b.branch}</span>
              <p className="text-3xl font-bold text-primary-600 mt-2">{b.placed}</p>
              <p className="text-sm text-gray-500 mt-1">Students Placed</p>
              <p className="text-xs text-gray-400 mt-2">of {b.total} eligible</p>
              <div className="bg-gray-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${b.total ? (b.placed / b.total * 100) : 0}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{b.total ? Math.round(b.placed / b.total * 100) : 0}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
