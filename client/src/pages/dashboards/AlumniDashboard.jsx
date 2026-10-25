import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Heart, UserCheck, Users, Loader2 } from 'lucide-react';
import KpiCard from '../../components/ui/KpiCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

export default function AlumniDashboard() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then(meRes => {
      const u = meRes.data.user || user;
      const alumniId = u?.alumni?.id || u?.alumniId;
      Promise.all([
        api.get('/donations/campaigns'),
        alumniId ? api.get(`/mentorship/requests/alumni/${alumniId}`) : Promise.resolve({ data: [] }),
      ]).then(([cRes, rRes]) => {
        setCampaigns(cRes.data.data || cRes.data.campaigns || (Array.isArray(cRes.data) ? cRes.data : []));
        setRequests(Array.isArray(rRes.data) ? rRes.data : (rRes.data.data || rRes.data.requests || []));
      }).catch(console.error).finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Alumni Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back, {user?.name?.split(' ')[0]}!</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Alumni Network" value="15+" icon={GraduationCap} color="blue" />
        <KpiCard title="Mentorship Requests" value={requests.length} icon={UserCheck} color="amber" />
        <KpiCard title="Campaigns Active" value={campaigns.filter(c => c.status === 'ACTIVE').length} icon={Heart} color="red" />
        <KpiCard title="Alumni Connected" value="15" icon={Users} color="green" />
      </div>

      {/* Campaigns */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Donation Campaigns</h3>
          <Link to="/alumni/donations" className="text-xs text-primary-600 hover:underline">View All</Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {campaigns.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">No active campaigns</p>
          ) : campaigns.slice(0, 3).map(c => {
            const pct = Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100));
            return (
              <div key={c.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.title}</p>
                  <StatusBadge status={c.status} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{pct}%</span>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Raised: {formatCurrency(c.raisedAmount)}</span>
                  <span>Goal: {formatCurrency(c.goalAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mentorship Requests */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Mentorship Requests</h3>
          <Link to="/alumni/mentorship" className="text-xs text-primary-600 hover:underline">View All</Link>
        </div>
        {requests.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">No mentorship requests yet</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {requests.slice(0, 5).map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-xs font-bold">{r.student?.user?.name?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.student?.user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{r.message}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
