import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  CheckCircle,
  Clock,
  Building2,
  Filter,
  Check,
  XCircle,
  Eye,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const PIPELINE_STEPS = [
  { key: 'APPLIED', label: 'Applied' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
  { key: 'SELECTED', label: 'Selected / Offer' }
];

export function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const isStudent = user?.role === 'STUDENT';
  const isOfficerOrAdmin = user?.role === 'ADMIN' || user?.role === 'PLACEMENT_OFFICER';

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      let list = [];
      if (isStudent && user?.student?.id) {
        const res = await api.get(`/placement/applications/student/${user.student.id}`);
        list = res.data || [];
      } else {
        const params = {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: search.trim() || undefined
        };
        const res = await api.get('/placement/applications', { params });
        list = res.data.data || res.data || [];
      }

      if (statusFilter !== 'ALL') {
        list = list.filter((a) => a.status === statusFilter);
      }
      setApplications(list);
    } catch {
      toast.error('Failed to load application history');
    } finally {
      setLoading(false);
    }
  }, [isStudent, user, statusFilter, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleWithdraw = async (id) => {
    try {
      await api.delete(`/placement/applications/${id}`);
      toast.success('Application withdrawn successfully');
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to withdraw application');
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'APPLIED': return 0;
      case 'SHORTLISTED': return 1;
      case 'INTERVIEW_SCHEDULED': return 2;
      case 'SELECTED':
      case 'OFFER_ACCEPTED': return 3;
      default: return -1;
    }
  };

  const columns = [
    {
      key: 'student',
      label: 'Candidate',
      render: (_, row) => (
        <div>
          <p className="font-bold text-xs text-gray-900 dark:text-white">
            {row.student?.user?.name || user?.name}
          </p>
          <p className="text-[11px] font-mono text-gray-500 mt-0.5">
            {row.student?.rollNumber || user?.student?.rollNumber} • {row.student?.branch || user?.student?.branch}
          </p>
        </div>
      )
    },
    {
      key: 'drive',
      label: 'Recruiting Drive & Company',
      render: (_, row) => (
        <div>
          <Link
            to={`/placement/drives/${row.drive?.id}`}
            className="font-bold text-xs text-gray-900 dark:text-white hover:text-primary-600 transition"
          >
            {row.drive?.company?.name || 'Recruiting Company'}
          </Link>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {row.drive?.role} • <span className="text-green-600 font-semibold">{row.drive?.ctc} LPA</span>
          </p>
        </div>
      )
    },
    {
      key: 'appliedAt',
      label: 'Applied On',
      render: (val) => <span className="text-xs text-gray-600 dark:text-gray-300">{formatDate(val)}</span>
    },
    {
      key: 'status',
      label: 'Stage / Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/placement/drives/${row.drive?.id}`}
            className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Drive</span>
          </Link>

          {isStudent && row.status === 'APPLIED' && (
            <button
              type="button"
              onClick={() => handleWithdraw(row.id)}
              className="text-[11px] text-red-600 hover:underline font-medium"
            >
              Withdraw
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isStudent ? 'My Placement Applications' : 'Candidate Application Tracker'}
        subtitle={
          isStudent
            ? 'Monitor hiring progress, upcoming interview rounds, and offer updates'
            : 'Review incoming candidate applications across all registered company drives'
        }
      />

      {/* Filter Row */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold uppercase text-gray-500">Filter by Stage:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input py-1 px-2.5 h-8 w-auto text-xs"
          >
            <option value="ALL">All Stages</option>
            <option value="APPLIED">Applied</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
            <option value="SELECTED">Selected</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>

        <span className="text-xs text-gray-500 font-medium">
          {applications.length} applications tracked
        </span>
      </div>

      {/* Student Horizontal Stepper Pipeline View */}
      {isStudent && applications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Live Recruitment Pipelines
          </h3>
          <div className="space-y-4">
            {applications.map((app) => {
              const currentStep = getStepIndex(app.status);
              const isRejected = app.status === 'REJECTED' || app.status === 'WITHDRAWN';

              return (
                <div key={app.id} className="card p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-gray-900 dark:text-white">
                          {app.drive?.company?.name}
                        </h4>
                        <span className="badge badge-green text-xs font-bold">{app.drive?.ctc} LPA</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Role: {app.drive?.role}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={app.status} />
                      <span className="text-xs text-gray-400">Applied {formatDate(app.appliedAt)}</span>
                    </div>
                  </div>

                  {/* Horizontal Stepper */}
                  {!isRejected ? (
                    <div className="pt-2">
                      <div className="grid grid-cols-4 gap-2 relative">
                        {PIPELINE_STEPS.map((step, idx) => {
                          const isDone = currentStep >= idx;
                          const isCurrent = currentStep === idx;
                          return (
                            <div key={step.key} className="flex flex-col items-center text-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition shadow-xs ${
                                  isDone
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-200 dark:bg-navy-800 text-gray-500'
                                } ${isCurrent ? 'ring-4 ring-primary-200 dark:ring-primary-950/60' : ''}`}
                              >
                                {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span
                                className={`text-[11px] font-medium mt-1.5 ${
                                  isDone
                                    ? 'text-gray-900 dark:text-white font-semibold'
                                    : 'text-gray-400'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded text-xs text-red-700 dark:text-red-400 font-medium">
                      Application has concluded with status: <strong>{app.status}</strong>.
                    </div>
                  )}

                  {app.notes && (
                    <div className="pt-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-navy-800/40 p-2.5 rounded">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Interviewer Notes:</span> {app.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Officer / Admin Global Applications Table */}
      {!isStudent && (
        <DataTable
          columns={columns}
          data={applications}
          loading={loading}
          onSearch={(term) => setSearch(term)}
          searchPlaceholder="Search candidate or company name..."
        />
      )}
    </div>
  );
}

export default Applications;
