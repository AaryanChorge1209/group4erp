import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Calendar,
  List,
  Eye,
  CheckCircle,
  XCircle,
  Building2,
  Clock,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export function Drives() {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [studentApplications, setStudentApplications] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Create Drive Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyId: '',
    role: '',
    description: '',
    ctc: '',
    driveDate: '',
    lastDateApply: '',
    batchYear: new Date().getFullYear(),
    minCgpa: 6.0,
    maxBacklogs: 0,
    allowedBranches: ['CSE', 'ECE', 'IT', 'MECH']
  });

  const isStudent = user?.role === 'STUDENT';
  const isOfficerOrAdmin = user?.role === 'ADMIN' || user?.role === 'PLACEMENT_OFFICER';

  const fetchDrives = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      };
      const [drivesRes, compRes] = await Promise.all([
        api.get('/placement/drives', { params }),
        isOfficerOrAdmin ? api.get('/placement/companies') : Promise.resolve({ data: [] })
      ]);

      let list = drivesRes.data.data || drivesRes.data.drives || (Array.isArray(drivesRes.data) ? drivesRes.data : []);
      if (!Array.isArray(list)) list = [];
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter(
          (d) =>
            d.role?.toLowerCase().includes(q) ||
            d.company?.name?.toLowerCase().includes(q)
        );
      }
      setDrives(list);
      setCompanies(compRes.data.data || compRes.data || (Array.isArray(compRes.data) ? compRes.data : []));

      const sid = user?.student?.id || user?.studentId;
      if (isStudent && sid) {
        const appsRes = await api.get(`/placement/applications/student/${sid}`);
        const appList = appsRes.data.data || appsRes.data || [];
        setStudentApplications(Array.isArray(appList) ? appList : []);
      }
    } catch {
      toast.error('Failed to load placement drives');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, isStudent, isOfficerOrAdmin, user]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const handleApply = async (driveId) => {
    try {
      await api.post('/placement/applications', { driveId });
      toast.success('Application registered successfully!');
      fetchDrives();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit application');
    }
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    if (!formData.companyId || !formData.role || !formData.ctc || !formData.driveDate || !formData.lastDateApply) {
      toast.error('Please fill all mandatory drive fields');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/placement/drives', {
        ...formData,
        ctc: parseFloat(formData.ctc),
        batchYear: parseInt(formData.batchYear),
        minCgpa: parseFloat(formData.minCgpa) || undefined,
        maxBacklogs: parseInt(formData.maxBacklogs) || 0,
        allowedBranches: JSON.stringify(formData.allowedBranches)
      });
      toast.success('Placement drive scheduled successfully!');
      setIsCreateOpen(false);
      fetchDrives();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule drive');
    } finally {
      setSubmitting(false);
    }
  };

  // Eligibility check logic for students
  const checkEligibility = (drive) => {
    if (!isStudent || !user?.student) return { eligible: true };
    const s = user.student;
    let branches = [];
    try {
      branches = JSON.parse(drive.allowedBranches);
    } catch {
      branches = [drive.allowedBranches];
    }

    if (drive.batchYear && drive.batchYear !== s.batch) {
      return { eligible: false, reason: `Batch ${drive.batchYear} only (you: ${s.batch})` };
    }
    if (branches.length && !branches.includes(s.branch)) {
      return { eligible: false, reason: `Branch ${s.branch} not open` };
    }
    if (drive.minCgpa && s.cgpa < drive.minCgpa) {
      return { eligible: false, reason: `Min CGPA ${drive.minCgpa} required (you: ${s.cgpa})` };
    }
    if (drive.maxBacklogs !== undefined && s.backlogs > drive.maxBacklogs) {
      return { eligible: false, reason: `Max ${drive.maxBacklogs} backlogs allowed (you: ${s.backlogs})` };
    }
    return { eligible: true };
  };

  const columns = [
    {
      key: 'company',
      label: 'Recruiting Company',
      render: (_, row) => (
        <div>
          <Link
            to={`/placement/companies/${row.company?.id}`}
            className="font-bold text-xs text-gray-900 dark:text-white hover:text-primary-600 transition"
          >
            {row.company?.name || 'Company'}
          </Link>
          <p className="text-[11px] text-gray-500 mt-0.5">{row.company?.industry}</p>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Job Designation',
      render: (val, row) => (
        <div>
          <Link to={`/placement/drives/${row.id}`} className="font-semibold text-xs text-gray-800 dark:text-gray-200 hover:text-primary-600">
            {val}
          </Link>
          <span className="badge badge-green text-[10px] ml-2 font-bold">{row.ctc} LPA</span>
        </div>
      )
    },
    {
      key: 'driveDate',
      label: 'Drive Date',
      render: (val) => <span className="text-xs font-semibold">{formatDate(val)}</span>
    },
    {
      key: 'lastDateApply',
      label: 'Deadline',
      render: (val) => {
        const passed = new Date(val) < new Date();
        return (
          <span className={`text-xs ${passed ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
            {formatDate(val)}
          </span>
        );
      }
    },
    {
      key: 'batchYear',
      label: 'Batch',
      render: (val) => <span className="text-xs font-mono">{val}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'applicants',
      label: 'Applicants',
      render: (_, row) => <span className="text-xs font-mono">{row._count?.applications || 0}</span>
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => {
        if (isStudent) {
          const applied = studentApplications.some((a) => a.driveId === row.id);
          const eligibility = checkEligibility(row);
          const deadlinePassed = new Date(row.lastDateApply) < new Date();

          if (applied) {
            return (
              <span className="badge badge-green text-[10px] flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Applied
              </span>
            );
          }

          if (deadlinePassed) {
            return <span className="text-xs text-gray-400">Closed</span>;
          }

          if (!eligibility.eligible) {
            return (
              <span className="text-[11px] text-red-500 font-medium" title={eligibility.reason}>
                Ineligible: {eligibility.reason}
              </span>
            );
          }

          return (
            <button
              type="button"
              onClick={() => handleApply(row.id)}
              className="btn btn-primary btn-sm text-[11px] py-1 px-3"
            >
              Apply Now
            </button>
          );
        }

        return (
          <Link
            to={`/placement/drives/${row.id}`}
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-navy-700 rounded transition"
            title="View Drive & Applicants"
          >
            <Eye className="w-4 h-4" />
          </Link>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Placement Drives"
        subtitle="Recruitment schedules, compensation packages, and eligibility criteria"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-navy-700 text-gray-600'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 ${viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-navy-700 text-gray-600'}`}
                title="Calendar View"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            {isOfficerOrAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Drive</span>
              </button>
            )}
          </div>
        }
      />

      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={drives}
          loading={loading}
          onSearch={(term) => setSearch(term)}
          searchPlaceholder="Search by job role or company..."
        />
      ) : (
        /* Calendar Month Grid View */
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Recruitment Calendar (Scheduled Drives)
            </h3>
            <span className="text-xs text-gray-500">Events grouped by drive dates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {drives.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-lg border border-primary-200 dark:border-primary-900/40 bg-primary-50/40 dark:bg-primary-950/20 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary-700 dark:text-primary-300">
                    {formatDate(d.driveDate)}
                  </span>
                  <span className="badge badge-green text-[10px] font-bold">{d.ctc} LPA</span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {d.company?.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{d.role}</p>
                <div className="pt-2 flex justify-between items-center text-[11px] text-gray-500">
                  <span>Batch {d.batchYear}</span>
                  <Link to={`/placement/drives/${d.id}`} className="text-primary-600 hover:underline font-semibold">
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Drive Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule Campus Placement Drive"
        size="lg"
      >
        <form onSubmit={handleCreateDrive} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Recruiting Company" required>
              <select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className="input"
                required
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Job Role / Title" required>
              <input
                type="text"
                required
                placeholder="e.g. Associate Software Engineer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Annual CTC Package (LPA in ₹)" required>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 7.5"
                value={formData.ctc}
                onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Graduating Batch Year" required>
              <input
                type="number"
                required
                value={formData.batchYear}
                onChange={(e) => setFormData({ ...formData, batchYear: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Drive Execution Date" required>
              <input
                type="date"
                required
                value={formData.driveDate}
                onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Last Date to Apply" required>
              <input
                type="date"
                required
                value={formData.lastDateApply}
                onChange={(e) => setFormData({ ...formData, lastDateApply: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Minimum CGPA Cutoff">
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.minCgpa}
                onChange={(e) => setFormData({ ...formData, minCgpa: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Max Backlogs Allowed">
              <input
                type="number"
                min="0"
                value={formData.maxBacklogs}
                onChange={(e) => setFormData({ ...formData, maxBacklogs: e.target.value })}
                className="input"
              />
            </FormField>
          </div>

          <FormField label="Job Description & Responsibilities">
            <textarea
              rows={2}
              placeholder="Candidate requirements, interview rounds, work location..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="btn btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary text-sm"
            >
              {submitting ? 'Scheduling...' : 'Publish Drive'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Drives;
