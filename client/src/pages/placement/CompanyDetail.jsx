import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  Briefcase,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export function CompanyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  const isOfficerOrAdmin = user?.role === 'ADMIN' || user?.role === 'PLACEMENT_OFFICER';

  useEffect(() => {
    async function loadCompany() {
      try {
        setLoading(true);
        const res = await api.get(`/placement/companies/${id}`);
        setCompany(res.data);
      } catch {
        toast.error('Company details could not be loaded');
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, [id]);

  const handleUpdateStatus = async (status) => {
    try {
      const endpoint = status === 'APPROVED' ? `/placement/companies/${id}/approve` : `/placement/companies/${id}/reject`;
      await api.post(endpoint);
      toast.success(`Company status updated to ${status}`);
      const res = await api.get(`/placement/companies/${id}`);
      setCompany(res.data);
    } catch {
      toast.error('Failed to change company status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Corporate Recruiter Profile" subtitle="Loading organization overview..." />
        <SkeletonLoader rows={6} cols={3} />
      </div>
    );
  }

  if (!company) {
    return (
      <EmptyState
        icon={Building2}
        title="Company Not Found"
        description="The requested company record was not found in the recruiting directory."
        action={
          <Link to="/placement/companies" className="btn btn-secondary">
            Back to Companies
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/placement/companies"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Recruiter Directory</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="card p-6 flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary-50 dark:bg-navy-800 border border-primary-200 dark:border-gray-700 flex items-center justify-center font-bold text-2xl text-primary-600 uppercase shadow-xs shrink-0">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="w-full h-full object-contain rounded-xl" />
            ) : (
              company.name.slice(0, 2)
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
              <StatusBadge status={company.status} />
            </div>
            <p className="text-xs text-gray-500 font-medium">{company.industry}</p>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
              {company.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <a href={`mailto:${company.email}`} className="hover:underline">{company.email}</a>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{company.phone}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-400" />
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline flex items-center gap-0.5">
                    <span>Visit Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {isOfficerOrAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            {company.status !== 'APPROVED' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('APPROVED')}
                className="btn btn-primary btn-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Company</span>
              </button>
            )}
            {company.status !== 'REJECTED' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('REJECTED')}
                className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Profile & Contacts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drives')}
            className={`py-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'drives'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Hiring Drives ({company.drives?.length || 0})</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Corporate Details</h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">Industry:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{company.industry}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">Partnership Status:</span>
                <StatusBadge status={company.status} />
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">Date Registered:</span>
                <span className="text-gray-700 dark:text-gray-300">{formatDate(company.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Recruitment Team</h3>
            {company.users && company.users.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {company.users.map((u) => (
                  <div key={u.id} className="py-2 text-xs">
                    <p className="font-bold text-gray-900 dark:text-white">{u.user?.name}</p>
                    <p className="text-gray-500 font-mono mt-0.5">{u.user?.email}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-4">No recruiter sub-accounts linked to this company.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'drives' && (
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Role</th>
                  <th>CTC Package</th>
                  <th>Batch</th>
                  <th>Drive Date</th>
                  <th>Last Apply Date</th>
                  <th>Applicants</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {company.drives && company.drives.length > 0 ? (
                  company.drives.map((d) => (
                    <tr key={d.id}>
                      <td className="font-bold text-xs">
                        <Link to={`/placement/drives/${d.id}`} className="hover:text-primary-600">
                          {d.role}
                        </Link>
                      </td>
                      <td className="text-xs font-semibold text-green-600">{d.ctc} LPA</td>
                      <td className="text-xs">{d.batchYear}</td>
                      <td className="text-xs">{formatDate(d.driveDate)}</td>
                      <td className="text-xs">{formatDate(d.lastDateApply)}</td>
                      <td className="text-xs font-mono">{d._count?.applications || 0}</td>
                      <td><StatusBadge status={d.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-xs text-gray-400">
                      No hiring drives conducted by this recruiter yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyDetail;
