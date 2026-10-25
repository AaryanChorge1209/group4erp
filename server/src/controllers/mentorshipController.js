const prisma = require('../utils/prisma');
const { createAuditLog, createNotification } = require('../utils/helpers');

const getMentors = async (req, res) => {
  try {
    const { branch, area } = req.query;
    const where = {
      offersmentoring: true
    };
    if (branch) where.branch = branch;
    if (area) where.mentoringAreas = { contains: area };

    const mentors = await prisma.alumni.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        _count: { select: { mentorRequests: true } }
      }
    });

    return res.json(mentors);
  } catch (error) {
    console.error('getMentors error:', error);
    return res.status(500).json({ error: 'Failed to fetch mentors' });
  }
};

const sendRequest = async (req, res) => {
  try {
    const { alumniId, message, areas } = req.body;
    if (!alumniId || !message) {
      return res.status(400).json({ error: 'Alumni ID and message are required' });
    }

    let studentId = req.body.studentId;
    if (req.user.role === 'STUDENT') {
      if (!req.user.student) {
        return res.status(400).json({ error: 'Student profile not linked to this user' });
      }
      studentId = req.user.student.id;
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const alumni = await prisma.alumni.findUnique({
      where: { id: alumniId },
      include: { user: true }
    });
    if (!alumni) {
      return res.status(404).json({ error: 'Alumni mentor not found' });
    }

    const request = await prisma.mentorshipRequest.create({
      data: {
        alumniId,
        studentId,
        message,
        areas: areas ? (typeof areas === 'string' ? areas : JSON.stringify(areas)) : null,
        status: 'PENDING'
      },
      include: {
        student: { include: { user: true } },
        alumni: { include: { user: true } }
      }
    });

    await createAuditLog(prisma, req.user.id, 'CREATE_MENTORSHIP_REQUEST', 'MentorshipRequest', request.id);

    await createNotification(
      prisma,
      alumni.userId,
      'New Mentorship Request',
      `Student ${request.student.user.name} sent you a mentorship request.`,
      'INFO',
      '/mentorship/requests'
    );

    return res.status(201).json(request);
  } catch (error) {
    console.error('sendRequest error:', error);
    return res.status(500).json({ error: 'Failed to send mentorship request' });
  }
};

const respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ACCEPTED' or 'DECLINED'

    if (!['ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be ACCEPTED or DECLINED' });
    }

    const existing = await prisma.mentorshipRequest.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        alumni: { include: { user: true } }
      }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Mentorship request not found' });
    }

    const updated = await prisma.mentorshipRequest.update({
      where: { id },
      data: {
        status,
        respondedAt: new Date()
      }
    });

    await createAuditLog(prisma, req.user.id, 'RESPOND_MENTORSHIP_REQUEST', 'MentorshipRequest', id, { status });

    await createNotification(
      prisma,
      existing.student.userId,
      `Mentorship Request ${status}`,
      `Alumni ${existing.alumni.user.name} has ${status.toLowerCase()} your mentorship request.`,
      status === 'ACCEPTED' ? 'SUCCESS' : 'INFO',
      '/mentorship/my-requests'
    );

    return res.json(updated);
  } catch (error) {
    console.error('respondToRequest error:', error);
    return res.status(500).json({ error: 'Failed to update mentorship request' });
  }
};

const getAlumniRequests = async (req, res) => {
  try {
    const { alumniId } = req.params;

    const requests = await prisma.mentorshipRequest.findMany({
      where: { alumniId },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, avatar: true } }
          }
        },
        sessions: { orderBy: { scheduledAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(requests);
  } catch (error) {
    console.error('getAlumniRequests error:', error);
    return res.status(500).json({ error: 'Failed to fetch alumni requests' });
  }
};

const getStudentRequests = async (req, res) => {
  try {
    const { studentId } = req.params;

    const requests = await prisma.mentorshipRequest.findMany({
      where: { studentId },
      include: {
        alumni: {
          include: {
            user: { select: { name: true, email: true, avatar: true } }
          }
        },
        sessions: { orderBy: { scheduledAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(requests);
  } catch (error) {
    console.error('getStudentRequests error:', error);
    return res.status(500).json({ error: 'Failed to fetch student requests' });
  }
};

const createSession = async (req, res) => {
  try {
    const { requestId, scheduledAt, notes } = req.body;
    if (!requestId || !scheduledAt) {
      return res.status(400).json({ error: 'requestId and scheduledAt are required' });
    }

    const session = await prisma.mentorSession.create({
      data: {
        requestId,
        scheduledAt: new Date(scheduledAt),
        notes: notes || null,
        status: 'SCHEDULED'
      },
      include: {
        request: {
          include: {
            student: { include: { user: true } },
            alumni: { include: { user: true } }
          }
        }
      }
    });

    await createAuditLog(prisma, req.user.id, 'CREATE_MENTOR_SESSION', 'MentorSession', session.id);

    // Notify student
    if (session.request?.student?.userId) {
      await createNotification(
        prisma,
        session.request.student.userId,
        'Mentorship Session Scheduled',
        `A session with ${session.request.alumni.user.name} has been scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
        'INFO',
        '/mentorship/sessions'
      );
    }

    return res.status(201).json(session);
  } catch (error) {
    console.error('createSession error:', error);
    return res.status(500).json({ error: 'Failed to create mentor session' });
  }
};

const getSessionsForRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const sessions = await prisma.mentorSession.findMany({
      where: { requestId },
      orderBy: { scheduledAt: 'desc' }
    });

    return res.json(sessions);
  } catch (error) {
    console.error('getSessionsForRequest error:', error);
    return res.status(500).json({ error: 'Failed to fetch mentor sessions' });
  }
};

module.exports = {
  getMentors,
  sendRequest,
  respondToRequest,
  getAlumniRequests,
  getStudentRequests,
  createSession,
  getSessionsForRequest
};
