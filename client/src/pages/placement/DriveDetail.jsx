import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Briefcase,
  ArrowLeft,
  Calendar,
  Building2,
  Users,
  Award,
  CheckCircle,
  Clock,
  Layers,
  Plus,
  Eye,
  FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export function DriveDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Applicants & Eligible Lists
  const [applicants, setApplicants] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [loadingEligible, setLoadingEligible] = useState(false);

  // Status Update Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [newStatus, setNewStatus] = useState('SHORTLISTED');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Add Round Modal
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [roundData, setRoundData] = useState({
    roundNumber: 1,
    roundType: 'ONLINE_TEST',
    scheduledAt: '',
    venue: '',
    notes: ''
  });
  const [creatingRound, setCreatingRound] = useState(false);

  const isOfficerOrCompany =
    user?.role === 'ADMIN' ||
    user?.role === 'PLACEMENT_OFFICER' ||
    user?.role === 'COMPANY';

  const fetchDrive = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/placement/drives/${id}`);
      setDrive(res.data);
    } catch {
      toast.error('Drive details could not be loaded');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDrive();
  }, [fetchDrive]);

  // Load applicants
  const loadApplicants = async () => {
    try {
      setLoadingApplicants(true);
      const res = await api.get(`/placement/drives/${id}/applicants`);
      setApplicants(res.data || []);
    } catch {
      toast.error('Failed to load drive applicants');
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Load eligible students
  const loadEligible = async () => {
    try {
      setLoadingEligible(true);
      const res = await api.get(`/placement/drives/${id}/eligible-students`);
      setEligibleStudents(res.data?.students || []);
    } catch {
      toast.error('Failed to load eligible students pool');
    } finally {
      setLoadingEligible(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'applicants') {
      loadApplicants();
    } else if (activeTab === 'eligible') {
      loadEligible();
    }
  }, [activeTab]);

  const handleUpdateApplicantStatus = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setUpdatingStatus(true);
      await api.put(`/placement/applications/${selectedApp.id}/status`, {
        status: newStatus,
        notes: statusNotes || undefined
      });
      toast.success(`Applicant advanced to ${newStatus}`);
      setSelectedApp(null);
      loadApplicants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update application status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    try {
      setCreatingRound(true);
      await api.post('/placement/rounds', {
        driveId: id,
        ...roundData
      });
      toast.success('Interview round configured successfully!');
      setIsRoundModalOpen(false);
      setRoundData({
        roundNumber: (drive?.rounds?.length || 0) + 2,
        roundType: 'TECHNICAL_INTERVIEW',
        scheduledAt: '',
        venue: '',
        notes: ''
      });
      fetchDrive();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add round');
    } finally {
      setCreatingRound(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Drive Details" subtitle="Loading recruitment requirements..." />
        <SkeletonLoader rows={6} cols={3} />
      </div>
    );
  }

  if (!drive) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Placement Drive Not Found"
        description="The requested drive record could not be located."
        action={
          <Link to="/placement/drives" className="btn btn-secondary">
            Back to Drives
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/placement/drives"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Drives</span>
        </Link>
      </div>

      {/* Header Info Banner */}
      <div className="card p-6 flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary-50 dark:bg-navy-800 border border-primary-200 dark:border-gray-700 flex items-center justify-center font-bold text-2xl text-primary-600 uppercase shadow-xs shrink-0">
            {drive.company?.name ? drive.company.name.slice(0, 2) : 'CO'}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{drive.role}</h1>
              <span className="badge badge-green text-xs font-bold">{drive.ctc} LPA</span>
              <StatusBadge status={drive.status} />
            </div>

            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {drive.company?.name} • <span className="text-gray-500 font-normal">{drive.company?.industry}</span>
            </p>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
              <div>
                <span className="text-gray-400">Drive Date:</span>{' '}
                <span className="font-semibold">{formatDate(drive.driveDate)}</span>
              </div>
              <div>
                <span className="text-gray-400">Application Deadline:</span>{' '}
                <span className="font-semibold text-red-500">{formatDate(drive.lastDateApply)}</span>
              </div>
              <div>
                <span className="text-gray-400">Batch:</span>{' '}
                <span className="font-mono font-semibold">{drive.batchYear}</span>
              </div>
            </div>
          </div>
        </div>

        {isOfficerOrCompany && (
          <button
            type="button"
            onClick={() => setIsRoundModalOpen(true)}
            className="btn btn-primary btn-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Interview Round</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Overview & Eligibility</span>
          </button>

          {isOfficerOrCompany && (
            <button
              type="button"
              onClick={() => setActiveTab('applicants')}
              className={`py-3 flex items-center gap-2 border-b-2 transition ${
                activeTab === 'applicants'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>Applicants ({drive._count?.applications || applicants.length})</span>
            </button>
          )}

          {isOfficerOrCompany && (
            <button
              type="button"
              onClick={() => setActiveTab('eligible')}
              className={`py-3 flex items-center gap-2 border-b-2 transition ${
                activeTab === 'eligible'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>Eligible Students Pool</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('rounds')}
            className={`py-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'rounds'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Interview Rounds ({drive.rounds?.length || 0})</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Eligibility Criteria</h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">Minimum CGPA Required:</span>
                <span className="font-bold text-gray-900 dark:text-white">{drive.minCgpa || 'None'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">Max Backlogs Allowed:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{drive.maxBacklogs ?? 0}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">Eligible Branches:</span>
                <span className="font-semibold text-primary-600">{drive.allowedBranches || 'All'}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">Eligible Batch:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{drive.batchYear}</span>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Role Synopsis</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {drive.description || 'Full-time graduate engineer training program with direct rotational placement.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Applicants */}
      {activeTab === 'applicants' && (
        <div className="card overflow-hidden">
          {loadingApplicants ? (
            <div className="p-6">
              <SkeletonLoader rows={5} cols={5} />
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll No</th>
                    <th>Branch</th>
                    <th>CGPA</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.length > 0 ? (
                    applicants.map((app) => (
                      <tr key={app.id}>
                        <td className="font-bold text-xs">{app.student?.user?.name}</td>
                        <td className="font-mono text-xs">{app.student?.rollNumber}</td>
                        <td className="text-xs">{app.student?.branch}</td>
                        <td className="text-xs font-semibold text-green-600">{app.student?.cgpa}</td>
                        <td className="text-xs">{formatDate(app.appliedAt)}</td>
                        <td><StatusBadge status={app.status} /></td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(app);
                              setNewStatus(app.status);
                            }}
                            className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5"
                          >
                            Update Status
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-xs text-gray-400">
                        No applications submitted for this drive yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Eligible Students Pool */}
      {activeTab === 'eligible' && (
        <div className="card overflow-hidden">
          {loadingEligible ? (
            <div className="p-6">
              <SkeletonLoader rows={5} cols={4} />
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Branch</th>
                    <th>CGPA</th>
                    <th>Application Status</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleStudents.length > 0 ? (
                    eligibleStudents.map((s) => (
                      <tr key={s.id}>
                        <td className="font-bold text-xs">{s.user?.name}</td>
                        <td className="font-mono text-xs">{s.rollNumber}</td>
                        <td className="text-xs">{s.branch}</td>
                        <td className="text-xs font-semibold text-green-600">{s.cgpa}</td>
                        <td>
                          {s.hasApplied ? (
                            <StatusBadge status={s.applicationStatus || 'APPLIED'} />
                          ) : (
                            <span className="badge badge-gray text-[10px]">Not Applied</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-xs text-gray-400">
                        No students in the institution meet the criteria for this drive.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Rounds */}
      {activeTab === 'rounds' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drive.rounds && drive.rounds.length > 0 ? (
              drive.rounds.map((round) => (
                <div key={round.id} className="card p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-purple text-xs font-bold">
                      Round #{round.roundNumber}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {round.scheduledAt ? formatDate(round.scheduledAt) : 'TBD'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    {round.roundType?.replace(/_/g, ' ')}
                  </h4>
                  {round.venue && (
                    <p className="text-xs text-gray-500">Venue: {round.venue}</p>
                  )}
                  {round.notes && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 italic">{round.notes}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-xs text-gray-400 card">
                No interview rounds registered yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Update Applicant Status Modal */}
      <Modal
        open={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title={`Advance Candidate — ${selectedApp?.student?.user?.name}`}
        size="md"
      >
        <form onSubmit={handleUpdateApplicantStatus} className="space-y-4">
          <FormField label="Evaluation Outcome / New Status" required>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="input"
            >
              <option value="SHORTLISTED">SHORTLISTED</option>
              <option value="INTERVIEW_SCHEDULED">INTERVIEW_SCHEDULED</option>
              <option value="SELECTED">SELECTED (Offer Extended)</option>
              <option value="OFFER_ACCEPTED">OFFER_ACCEPTED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </FormField>

          <FormField label="Interviewer Feedback / Notes">
            <textarea
              rows={3}
              placeholder="Technical strengths, communication evaluation..."
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              className="input"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setSelectedApp(null)}
              className="btn btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingStatus}
              className="btn btn-primary text-sm"
            >
              {updatingStatus ? 'Updating...' : 'Confirm Candidate Progression'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Round Modal */}
      <Modal
        open={isRoundModalOpen}
        onClose={() => setIsRoundModalOpen(false)}
        title="Configure Interview Round"
        size="md"
      >
        <form onSubmit={handleCreateRound} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Round Sequence #" required>
              <input
                type="number"
                min="1"
                required
                value={roundData.roundNumber}
                onChange={(e) => setRoundData({ ...roundData, roundNumber: e.target.value })}
                className="input"
              />
            </FormField>

            <FormField label="Assessment Type" required>
              <select
                value={roundData.roundType}
                onChange={(e) => setRoundData({ ...roundData, roundType: e.target.value })}
                className="input"
              >
                <option value="ONLINE_TEST">Online Coding / Aptitude Test</option>
                <option value="TECHNICAL_INTERVIEW">Technical Interview</option>
                <option value="MANAGERIAL_INTERVIEW">Managerial Interview</option>
                <option value="HR_INTERVIEW">HR Interview</option>
                <option value="GROUP_DISCUSSION">Group Discussion</option>
              </select>
            </FormField>
          </div>

          <FormField label="Scheduled Date & Time">
            <input
              type="datetime-local"
              value={roundData.scheduledAt}
              onChange={(e) => setRoundData({ ...roundData, scheduledAt: e.target.value })}
              className="input"
            />
          </FormField>

          <FormField label="Venue / Meeting URL">
            <input
              type="text"
              placeholder="e.g. Lab 4B / Google Meet Link"
              value={roundData.venue}
              onChange={(e) => setRoundData({ ...roundData, venue: e.target.value })}
              className="input"
            />
          </FormField>

          <FormField label="Instructions & Format">
            <textarea
              rows={2}
              placeholder="e.g. 60 min algorithmic challenge..."
              value={roundData.notes}
              onChange={(e) => setRoundData({ ...roundData, notes: e.target.value })}
              className="input"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsRoundModalOpen(false)}
              className="btn btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingRound}
              className="btn btn-primary text-sm"
            >
              {creatingRound ? 'Saving Round...' : 'Save Round'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DriveDetail;
