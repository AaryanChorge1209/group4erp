import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, CheckCircle, Loader2, Briefcase } from 'lucide-react';
import KpiCard from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [stats, setStats] = useState({ drives: 0, applicants: 0, shortlisted: 0, selected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/placement/drives').then(res => {
      const myDrives = res.data.data || res.data.drives || (Array.isArray(res.data) ? res.data : []);
      setDrives(myDrives);
      const applicants = myDrives.reduce((a, d) => a + (d._count?.applications || 0), 0);
      setStats({ drives: myDrives.length, applicants, shortlisted: 0, selected: 0 });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Company Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome, {user?.name}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="My Drives" value={stats.drives} icon={Briefcase} color="blue" />
        <KpiCard title="Total Applicants" value={stats.applicants} icon={Users} color="indigo" />
        <KpiCard title="Shortlisted" value={stats.shortlisted} icon={CheckCircle} color="amber" />
        <KpiCard title="Selected" value={stats.selected} icon={CheckCircle} color="green" />
      </div>
      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-gray-900 dark:text-white">My Recruitment Drives</h3></div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Role</th><th>CTC (LPA)</th><th>Drive Date</th><th>Applicants</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {drives.map(d => (
                <tr key={d.id}>
                  <td className="font-medium">{d.role}</td>
                  <td>₹{d.ctc}</td>
                  <td>{formatDate(d.driveDate)}</td>
                  <td>{d._count?.applications || 0}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td><Link to={`/placement/drives/${d.id}`} className="text-primary-600 text-sm hover:underline">View</Link></td>
                </tr>
              ))}
              {drives.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No drives created yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
