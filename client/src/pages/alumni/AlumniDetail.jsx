import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  ArrowLeft,
  Building2,
  MapPin,
  CheckCircle2,
  HeartHandshake,
  Gift,
  Mail,
  Calendar,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, formatCurrency } from '../../lib/utils';

export function AlumniDetail() {
  const { id } = useParams();
  const [alumni, setAlumni] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    async function loadAlumni() {
      try {
        setLoading(true);
        const res = await api.get(`/alumni/${id}`);
        setAlumni(res.data);
      } catch {
        toast.error('Alumni profile details could not be loaded');
      } finally {
        setLoading(false);
      }
    }
    loadAlumni();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Alumni Profile" subtitle="Loading graduate biography..." />
        <SkeletonLoader rows={6} cols={3} />
      </div>
    );
  }

  if (!alumni) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Alumni Profile Not Found"
        description="The requested alumni record is not available."
        action={
          <Link to="/alumni/directory" className="btn btn-secondary">
            Back to Directory
          </Link>
        }
      />
    );
  }

  const name = alumni.name || alumni.user?.name || 'Alumnus';
  const skills = typeof alumni.skills === 'string' ? JSON.parse(alumni.skills || '[]') : alumni.skills || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/alumni/directory"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Alumni Directory</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="card p-6 flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-2xl uppercase shadow-sm shrink-0">
            {name.slice(0, 2)}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h1>
              {alumni.isVerified && (
                <span className="badge badge-blue text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Alumnus
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {alumni.currentRole} at {alumni.currentCompany}
            </p>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
              <div>
                <span className="text-gray-400">Class Year:</span>{' '}
                <span className="font-semibold">{alumni.graduationYear || alumni.batch}</span>
              </div>
              <div>
                <span className="text-gray-400">Department:</span>{' '}
                <span className="font-semibold">{alumni.branch}</span>
              </div>
              {alumni.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{alumni.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
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
            <span>Biography & Skills</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mentorship')}
            className={`py-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'mentorship'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Mentorships ({alumni.mentorRequests?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('donations')}
            className={`py-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'donations'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Giving History ({alumni.donations?.length || 0})</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Academic Background</h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">College Roll No:</span>
                <span className="font-mono font-semibold">{alumni.rollNumber}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">Degree Program:</span>
                <span className="font-semibold">Bachelor of Technology ({alumni.branch})</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-400">Graduation Year:</span>
                <span className="font-semibold">{alumni.graduationYear}</span>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Skills & Industry Competencies</h3>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {skills.map((s, idx) => (
                  <span key={idx} className="badge badge-purple text-xs">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-3">No skills listed on this profile.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Mentorship */}
      {activeTab === 'mentorship' && (
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Inquiry Note</th>
                  <th>Submitted On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {alumni.mentorRequests && alumni.mentorRequests.length > 0 ? (
                  alumni.mentorRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="font-bold text-xs">{req.student?.user?.name || 'Student'}</td>
                      <td className="text-xs max-w-sm truncate text-gray-600 dark:text-gray-300">
                        {req.message}
                      </td>
                      <td className="text-xs">{formatDate(req.createdAt)}</td>
                      <td><StatusBadge status={req.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-xs text-gray-400">
                      No active mentorship sessions recorded for this alumnus.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Donations */}
      {activeTab === 'donations' && (
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Amount</th>
                  <th>Purpose</th>
                  <th>Contributed On</th>
                </tr>
              </thead>
              <tbody>
                {alumni.donations && alumni.donations.length > 0 ? (
                  alumni.donations.map((d) => (
                    <tr key={d.id}>
                      <td className="font-bold text-xs">{d.campaign?.title || 'General Fund'}</td>
                      <td className="text-xs font-bold text-green-600">{formatCurrency(d.amount)}</td>
                      <td className="text-xs">{d.purpose}</td>
                      <td className="text-xs">{formatDate(d.date || d.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-xs text-gray-400">
                      No philanthropic contributions on record.
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

export default AlumniDetail;
