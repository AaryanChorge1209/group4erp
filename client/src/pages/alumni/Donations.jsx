import React, { useState, useEffect, useCallback } from 'react';
import {
  Gift,
  Trophy,
  Heart,
  TrendingUp,
  CreditCard,
  Plus,
  CheckCircle,
  Clock,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { formatDate, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export function Donations() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Donate Modal
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    campaignId: '',
    amount: '',
    purpose: 'Scholarship Support',
    paymentMode: 'UPI'
  });

  const isAlumni = user?.role === 'ALUMNI';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [campRes, leadRes, donRes] = await Promise.all([
        api.get('/donations/campaigns'),
        api.get('/donations/leaderboard'),
        api.get('/donations')
      ]);

      setCampaigns(campRes.data || []);
      setLeaderboard(leadRes.data || []);

      const all = donRes.data.data || donRes.data || [];
      if (user?.alumni?.id) {
        setMyDonations(all.filter((d) => d.alumniId === user.alumni.id));
      } else {
        setMyDonations(all);
      }
    } catch {
      toast.error('Failed to load donation campaigns and giving leaderboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.purpose) {
      toast.error('Donation amount and purpose are required');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/donations', {
        ...formData,
        amount: parseFloat(formData.amount),
        campaignId: formData.campaignId || undefined,
        alumniId: user?.alumni?.id || undefined
      });
      toast.success('Thank you for your generous contribution!');
      setIsDonateOpen(false);
      setFormData({ campaignId: '', amount: '', purpose: 'Scholarship Support', paymentMode: 'UPI' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record donation');
    } finally {
      setSubmitting(false);
    }
  };

  const leaderboardColumns = [
    {
      key: 'rank',
      label: 'Rank',
      render: (_, __, idx) => (
        <span className={`font-mono font-bold text-xs ${idx === 0 ? 'text-amber-500 font-extrabold' : ''}`}>
          #{idx + 1}
        </span>
      )
    },
    {
      key: 'alumni',
      label: 'Benefactor / Alumnus',
      render: (_, row) => (
        <div>
          <p className="font-bold text-xs text-gray-900 dark:text-white">
            {row.alumni?.name || row.alumni?.user?.name || 'Anonymous Patron'}
          </p>
          <p className="text-[11px] text-gray-500">{row.alumni?.currentCompany || 'Alumni Partner'}</p>
        </div>
      )
    },
    {
      key: 'totalAmount',
      label: 'Total Giving',
      sortable: true,
      render: (val, row) => (
        <span className="font-bold text-xs text-green-600 dark:text-green-400">
          {formatCurrency(val || row._sum?.amount || 0)}
        </span>
      )
    }
  ];

  const donationColumns = [
    {
      key: 'campaign',
      label: 'Fund / Campaign',
      render: (_, row) => (
        <span className="font-bold text-xs text-gray-900 dark:text-white">
          {row.campaign?.title || 'Unrestricted Institutional Fund'}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount (₹)',
      render: (val) => <span className="font-bold text-xs text-green-600">{formatCurrency(val)}</span>
    },
    {
      key: 'purpose',
      label: 'Purpose',
      render: (val) => <span className="text-xs text-gray-600 dark:text-gray-300">{val}</span>
    },
    {
      key: 'paymentMode',
      label: 'Mode',
      render: (val) => <span className="badge badge-purple text-[10px]">{val}</span>
    },
    {
      key: 'date',
      label: 'Date',
      render: (val, row) => <span className="text-xs text-gray-500">{formatDate(val || row.createdAt)}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Giving & Philanthropic Campaigns"
        subtitle="Empowering future engineers through student scholarships, innovation labs, and infrastructure endowments"
        actions={
          <button
            type="button"
            onClick={() => setIsDonateOpen(true)}
            className="btn btn-primary btn-sm"
          >
            <Gift className="w-4 h-4" />
            <span>Contribute Now</span>
          </button>
        }
      />

      {/* Campaigns Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          <span>Active Endowments & Campaigns</span>
        </h3>

        {loading ? (
          <SkeletonLoader rows={2} cols={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => {
              const raised = c.currentAmount || 0;
              const goal = c.goalAmount || 1;
              const pct = Math.min(100, Math.round((raised / goal) * 100));
              return (
                <div key={c.id} className="card p-5 flex flex-col justify-between hover:shadow-card-hover transition-all">
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="badge badge-green text-xs font-bold">{pct}% Funded</span>
                      <span className="text-[11px] text-gray-400">Ends {formatDate(c.endDate)}</span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-2">{c.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-3 leading-relaxed">
                      {c.description || 'College modernization and scholarship fund.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                    <div className="w-full bg-gray-200 dark:bg-navy-800 rounded-full h-2 mb-2 overflow-hidden">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-900 dark:text-white">{formatCurrency(raised)}</span>
                      <span className="text-gray-400">Goal: {formatCurrency(goal)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, campaignId: c.id });
                        setIsDonateOpen(true);
                      }}
                      className="btn btn-secondary btn-sm w-full justify-center mt-3 text-xs"
                    >
                      Give to this Fund
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Leaderboard & My Donations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Donors Leaderboard */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Donor Honor Roll
            </h3>
          </div>

          <div className="table-wrapper border-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patron</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length > 0 ? (
                  leaderboard.slice(0, 5).map((entry, idx) => (
                    <tr key={idx}>
                      <td className="font-bold text-xs">{idx + 1}</td>
                      <td className="text-xs font-medium">{entry.alumni?.name || 'Anonymous'}</td>
                      <td className="text-xs font-bold text-green-600">{formatCurrency(entry.totalAmount || 0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-xs text-gray-400">No donor records yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Giving History Table */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-600" />
              <span>{isAlumni ? 'My Giving Record' : 'Recent Institutional Contributions'}</span>
            </h3>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Amount</th>
                  <th>Purpose</th>
                  <th>Mode</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {myDonations.length > 0 ? (
                  myDonations.map((d) => (
                    <tr key={d.id}>
                      <td className="font-bold text-xs">{d.campaign?.title || 'General Fund'}</td>
                      <td className="text-xs font-bold text-green-600">{formatCurrency(d.amount)}</td>
                      <td className="text-xs">{d.purpose}</td>
                      <td><span className="badge badge-purple text-[10px]">{d.paymentMode}</span></td>
                      <td className="text-xs text-gray-500">{formatDate(d.date || d.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-xs text-gray-400">
                      No contributions logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Donate Modal */}
      <Modal
        open={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        title="Make a Philanthropic Contribution"
        size="md"
      >
        <form onSubmit={handleDonateSubmit} className="space-y-4">
          <FormField label="Campaign / Department Fund">
            <select
              value={formData.campaignId}
              onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
              className="input"
            >
              <option value="">Unrestricted Institutional Fund</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Contribution Amount (₹)" required>
            <input
              type="number"
              min={100}
              required
              placeholder="e.g. 5000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Fund Purpose" required>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="input"
              >
                <option value="Scholarship Support">Scholarship Support</option>
                <option value="Lab Equipment Upgrade">Lab Equipment Upgrade</option>
                <option value="Library Book Grant">Library Book Grant</option>
                <option value="Campus Infrastructure">Campus Infrastructure</option>
              </select>
            </FormField>

            <FormField label="Payment Channel" required>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="input"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="NET_BANKING">Net Banking (NEFT/RTGS)</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
                <option value="CHEQUE">Bank Draft / Cheque</option>
              </select>
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsDonateOpen(false)}
              className="btn btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary text-sm"
            >
              {submitting ? 'Processing...' : 'Confirm Contribution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Donations;
