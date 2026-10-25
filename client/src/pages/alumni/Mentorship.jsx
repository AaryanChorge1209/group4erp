import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartHandshake,
  Users,
  Calendar,
  Check,
  X,
  MessageSquare,
  Building2,
  Clock,
  Plus
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

export function Mentorship() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'requests' | 'sessions'
  const [mentors, setMentors] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Send request modal
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [interestAreas, setInterestAreas] = useState('Cloud Computing & DevOps');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Log session modal
  const [sessionTarget, setSessionTarget] = useState(null);
  const [sessionData, setSessionData] = useState({ scheduledAt: '', notes: '' });
  const [loggingSession, setLoggingSession] = useState(false);

  const isStudent = user?.role === 'STUDENT';
  const isAlumni = user?.role === 'ALUMNI';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const mentorsRes = await api.get('/mentorship/mentors');
      const mList = mentorsRes.data.data || mentorsRes.data || [];
      setMentors(Array.isArray(mList) ? mList : []);

      const aid = user?.alumni?.id || user?.alumniId;
      const sid = user?.student?.id || user?.studentId;
      if (isAlumni && aid) {
        const reqRes = await api.get(`/mentorship/requests/alumni/${aid}`);
        const rList = reqRes.data.data || reqRes.data || [];
        setMyRequests(Array.isArray(rList) ? rList : []);
      } else if (isStudent && sid) {
        const reqRes = await api.get(`/mentorship/requests/student/${sid}`);
        const rList = reqRes.data.data || reqRes.data || [];
        setMyRequests(Array.isArray(rList) ? rList : []);
      }
    } catch {
      toast.error('Failed to load mentorship hub data');
    } finally {
      setLoading(false);
    }
  }, [isAlumni, isStudent, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedMentor || !requestMessage.trim()) {
      toast.error('Please include an introductory message');
      return;
    }

    try {
      setSubmittingRequest(true);
      await api.post('/mentorship/requests', {
        alumniId: selectedMentor.id,
        message: requestMessage.trim(),
        areas: interestAreas
      });
      toast.success('Mentorship request transmitted to alumni mentor!');
      setSelectedMentor(null);
      setRequestMessage('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleRespond = async (requestId, status) => {
    try {
      await api.put(`/mentorship/requests/${requestId}`, { status });
      toast.success(`Request marked as ${status.toLowerCase()}`);
      loadData();
    } catch {
      toast.error('Failed to respond to request');
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionTarget || !sessionData.scheduledAt) {
      toast.error('Scheduled date and time are required');
      return;
    }

    try {
      setLoggingSession(true);
      await api.post('/mentorship/sessions', {
        requestId: sessionTarget.id,
        scheduledAt: sessionData.scheduledAt,
        notes: sessionData.notes || undefined
      });
      toast.success('Mentorship session scheduled and meeting invitation issued!');
      setSessionTarget(null);
      setSessionData({ scheduledAt: '', notes: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule session');
    } finally {
      setLoggingSession(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumni-Student Mentorship Hub"
        subtitle="Bridging classroom curriculum with real-world engineering careers, mock interviews, and technical roadmaps"
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('browse')}
          className={`py-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'browse'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Browse Mentors ({mentors.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`py-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'requests'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Mentorship Inquiries ({myRequests.length})</span>
        </button>
      </div>

      {loading ? (
        <SkeletonLoader rows={4} cols={3} />
      ) : activeTab === 'browse' ? (
        /* Browse Mentors Grid */
        mentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((m) => {
              const name = m.name || m.user?.name || 'Mentor';
              return (
                <div key={m.id} className="card p-5 flex flex-col justify-between hover:shadow-card-hover transition-all">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-base uppercase shrink-0">
                        {name.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{name}</h4>
                        <p className="text-xs text-gray-500">
                          {m.currentRole} at <span className="font-semibold text-gray-800 dark:text-gray-200">{m.currentCompany}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300 mt-2">
                      <p><span className="text-gray-400">Class:</span> {m.graduationYear} ({m.branch})</p>
                      {m.mentoringAreas && (
                        <p className="text-[11px] text-primary-600 font-medium mt-1">
                          Areas: {m.mentoringAreas}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono">
                      {m._count?.mentorRequests || 0} mentees
                    </span>

                    {isStudent && (
                      <button
                        type="button"
                        onClick={() => setSelectedMentor(m)}
                        className="btn btn-primary btn-sm text-[11px] py-1 px-3"
                      >
                        Request Mentorship
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={HeartHandshake}
            title="No Active Mentors Available"
            description="Alumni mentors who activate guidance availability will appear here."
          />
        )
      ) : (
        /* Requests & Sessions List */
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Message / Goals</th>
                  <th>Focus Area</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.length > 0 ? (
                  myRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="font-bold text-xs">
                        {req.student?.user?.name || user?.name}
                      </td>
                      <td className="text-xs max-w-xs truncate text-gray-600 dark:text-gray-300">
                        {req.message}
                      </td>
                      <td className="text-xs text-primary-600 font-medium">
                        {req.areas || 'General Career Advice'}
                      </td>
                      <td className="text-xs">{formatDate(req.createdAt)}</td>
                      <td><StatusBadge status={req.status} /></td>
                      <td>
                        {isAlumni && req.status === 'PENDING' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRespond(req.id, 'ACCEPTED')}
                              className="btn btn-primary btn-sm text-[11px] py-1 px-2.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRespond(req.id, 'DECLINED')}
                              className="btn btn-secondary btn-sm text-[11px] py-1 px-2 text-red-600 hover:bg-red-50"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {isAlumni && req.status === 'ACCEPTED' && (
                          <button
                            type="button"
                            onClick={() => setSessionTarget(req)}
                            className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5 text-primary-600"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Schedule Session</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-xs text-gray-400">
                      No mentorship inquiries found in this queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Modal */}
      <Modal
        open={Boolean(selectedMentor)}
        onClose={() => setSelectedMentor(null)}
        title={`Request Guidance — ${selectedMentor?.name || selectedMentor?.user?.name}`}
        size="md"
      >
        <form onSubmit={handleSendRequest} className="space-y-4">
          <FormField label="Area of Guidance" required>
            <select
              value={interestAreas}
              onChange={(e) => setInterestAreas(e.target.value)}
              className="input"
            >
              <option value="System Design & Backend">System Design & Backend</option>
              <option value="Frontend Engineering & UI/UX">Frontend Engineering & UI/UX</option>
              <option value="Machine Learning & Data Science">Machine Learning & Data Science</option>
              <option value="Higher Studies & GRE/GATE Advice">Higher Studies & GRE/GATE Advice</option>
              <option value="Mock Technical Interview">Mock Technical Interview</option>
            </select>
          </FormField>

          <FormField label="Personal Message / Aspirations" required>
            <textarea
              rows={4}
              required
              placeholder="Introduce your academic background and 2-3 specific topics you would like guidance on..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="input"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setSelectedMentor(null)}
              className="btn btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRequest}
              className="btn btn-primary text-sm"
            >
              {submittingRequest ? 'Transmitting...' : 'Send Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Session Modal */}
      <Modal
        open={Boolean(sessionTarget)}
        onClose={() => setSessionTarget(null)}
        title="Schedule Mentorship Session"
        size="md"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <FormField label="Meeting Date & Time" required>
            <input
              type="datetime-local"
              required
              value={sessionData.scheduledAt}
              onChange={(e) => setSessionData({ ...sessionData, scheduledAt: e.target.value })}
              className="input"
            />
          </FormField>

          <FormField label="Meeting Agenda & Platform Link">
            <textarea
              rows={3}
              placeholder="e.g. Google Meet Link: meet.google.com/xyz-abc... We will cover resume review."
              value={sessionData.notes}
              onChange={(e) => setSessionData({ ...sessionData, notes: e.target.value })}
              className="input"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setSessionTarget(null)}
              className="btn btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loggingSession}
              className="btn btn-primary text-sm"
            >
              {loggingSession ? 'Saving...' : 'Confirm Session'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Mentorship;
