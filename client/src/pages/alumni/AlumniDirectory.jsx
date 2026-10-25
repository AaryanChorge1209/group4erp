import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  MapPin,
  CheckCircle2,
  HeartHandshake,
  Search,
  Filter,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';

const BRANCHES = ['All', 'CSE', 'ECE', 'IT', 'MECH', 'CIVIL'];

export function AlumniDirectory() {
  const { user } = useAuth();
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [batchYear, setBatchYear] = useState('');

  // Mentorship Request Modal
  const [targetAlumni, setTargetAlumni] = useState(null);
  const [message, setMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const fetchAlumni = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim() || undefined,
        branch: selectedBranch !== 'All' ? selectedBranch : undefined,
        batch: batchYear.trim() || undefined
      };
      const res = await api.get('/alumni', { params });
      setAlumniList(res.data.data || res.data || []);
    } catch {
      toast.error('Failed to load alumni directory');
    } finally {
      setLoading(false);
    }
  }, [search, selectedBranch, batchYear]);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  const handleSendMentorshipRequest = async (e) => {
    e.preventDefault();
    if (!targetAlumni || !message.trim()) {
      toast.error('Please enter a note to introduce your goals');
      return;
    }

    try {
      setSendingRequest(true);
      await api.post('/mentorship/requests', {
        alumniId: targetAlumni.id,
        message: message.trim()
      });
      toast.success(`Mentorship inquiry sent to ${targetAlumni.name || targetAlumni.user?.name}!`);
      setTargetAlumni(null);
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit mentorship request');
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumni Network & Global Directory"
        subtitle="Connect with graduated scholars, explore industry pathways, and initiate professional mentorships"
      />

      {/* Filter Row */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search alumni by name, employer, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="input py-1 px-2.5 h-8 w-auto text-xs"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b === 'All' ? 'All Engineering Branches' : b}
                </option>
              ))}
            </select>
          </div>

          <input
            type="number"
            placeholder="Batch Year (e.g. 2018)"
            value={batchYear}
            onChange={(e) => setBatchYear(e.target.value)}
            className="input py-1 px-2.5 h-8 w-36 text-xs"
          />
        </div>
      </div>

      {/* Alumni Card Grid */}
      {loading ? (
        <SkeletonLoader rows={4} cols={3} />
      ) : alumniList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumniList.map((alumnus) => {
            const name = alumnus.name || alumnus.user?.name || 'Alumnus';
            return (
              <div
                key={alumnus.id}
                className="card p-5 flex flex-col justify-between hover:shadow-card-hover transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-base uppercase shrink-0">
                        {name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/alumni/${alumnus.id}`}
                            className="font-bold text-sm text-gray-900 dark:text-white hover:text-primary-600 transition"
                          >
                            {name}
                          </Link>
                          {alumnus.isVerified && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 text-white shrink-0" title="Verified Alumnus" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Class of {alumnus.graduationYear || alumnus.batch} • {alumnus.branch}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 mt-2">
                    {alumnus.currentCompany && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {alumnus.currentRole ? `${alumnus.currentRole} at ` : ''}{alumnus.currentCompany}
                        </span>
                      </div>
                    )}
                    {alumnus.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{alumnus.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills preview */}
                  {alumnus.skills && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(typeof alumnus.skills === 'string'
                        ? JSON.parse(alumnus.skills || '[]')
                        : alumnus.skills || []
                      ).slice(0, 4).map((skill, idx) => (
                        <span key={idx} className="badge badge-purple text-[10px]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                  <Link
                    to={`/alumni/${alumnus.id}`}
                    className="text-xs text-primary-600 hover:underline font-semibold"
                  >
                    View Bio
                  </Link>

                  <button
                    type="button"
                    onClick={() => setTargetAlumni(alumnus)}
                    className="btn btn-secondary btn-sm text-[11px] py-1 px-3"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-primary-600" />
                    <span>Connect</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No Alumni Match Your Search"
          description="Adjust your search criteria or explore other engineering branches."
        />
      )}

      {/* Mentorship Connection Modal */}
      <Modal
        open={Boolean(targetAlumni)}
        onClose={() => setTargetAlumni(null)}
        title={`Connect with ${targetAlumni?.name || targetAlumni?.user?.name}`}
        size="md"
      >
        <form onSubmit={handleSendMentorshipRequest} className="space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Send an introductory note to request 1-on-1 career guidance, mock interviews, or industry insights from this alumnus.
          </p>

          <FormField label="Your Message / Learning Objectives" required>
            <textarea
              rows={4}
              required
              placeholder="e.g. Hi! I'm a 3rd year CSE student interested in cloud distributed systems. I would love some advice regarding preparing for technical interviews..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setTargetAlumni(null)}
              className="btn btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendingRequest}
              className="btn btn-primary text-sm"
            >
              {sendingRequest ? 'Sending...' : 'Send Inquiry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AlumniDirectory;
