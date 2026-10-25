const prisma = require('../../utils/prisma');
const { createAuditLog, createNotification } = require('../../utils/helpers');

const applyToDrive = async (req, res) => {
  try {
    const { driveId, studentId: rawStudentId } = req.body;
    if (!driveId) {
      return res.status(400).json({ error: 'Drive ID is required' });
    }

    let studentId = rawStudentId;
    if (req.user.role === 'STUDENT') {
      if (!req.user.student) {
        return res.status(400).json({ error: 'Student profile not linked to this user' });
      }
      studentId = req.user.student.id;
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // 1. Fetch drive
    const drive = await prisma.placementDrive.findUnique({
      where: { id: driveId },
      include: { company: true }
    });
    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' });
    }

    // 2. Check deadline
    const now = new Date();
    if (now > new Date(drive.lastDateApply)) {
      return res.status(400).json({ error: 'Application deadline for this drive has passed' });
    }

    // 3. Check student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // 4. Check eligibility
    let allowedBranches = [];
    try {
      allowedBranches = JSON.parse(drive.allowedBranches);
    } catch (e) {
      allowedBranches = [drive.allowedBranches];
    }

    if (drive.batchYear !== student.batch) {
      return res.status(400).json({ error: `Drive is open only for batch ${drive.batchYear}` });
    }
    if (!allowedBranches.includes(student.branch)) {
      return res.status(400).json({ error: `Branch ${student.branch} is not eligible for this drive` });
    }
    if (student.cgpa < drive.minCgpa) {
      return res.status(400).json({ error: `CGPA ${student.cgpa} is below the required ${drive.minCgpa}` });
    }
    if (student.backlogs > drive.maxBacklogs) {
      return res.status(400).json({ error: `Maximum allowed backlogs is ${drive.maxBacklogs}` });
    }

    // 5. Check if already applied
    const existing = await prisma.application.findUnique({
      where: {
        driveId_studentId: {
          driveId,
          studentId
        }
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this drive' });
    }

    const application = await prisma.application.create({
      data: {
        driveId,
        studentId,
        status: 'APPLIED'
      },
      include: {
        drive: { include: { company: true } },
        student: { include: { user: true } }
      }
    });

    await createAuditLog(prisma, req.user.id, 'APPLY_DRIVE', 'Application', application.id, {
      driveId,
      company: drive.company.name,
      role: drive.role
    });

    await createNotification(
      prisma,
      student.userId,
      'Application Submitted',
      `You successfully applied for ${drive.role} at ${drive.company.name}.`,
      'SUCCESS',
      '/placement/my-applications'
    );

    return res.status(201).json(application);
  } catch (error) {
    console.error('applyToDrive error:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit application' });
  }
};

const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (req.user.role === 'STUDENT' && req.user.student?.id !== application.studentId) {
      return res.status(403).json({ error: 'Unauthorized to withdraw this application' });
    }

    if (application.status !== 'APPLIED') {
      return res.status(400).json({ error: `Cannot withdraw application once status is ${application.status}` });
    }

    await prisma.application.update({
      where: { id },
      data: { status: 'WITHDRAWN' }
    });

    await createAuditLog(prisma, req.user.id, 'WITHDRAW_APPLICATION', 'Application', id);

    return res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('withdrawApplication error:', error);
    return res.status(500).json({ error: 'Failed to withdraw application' });
  }
};

const getStudentApplications = async (req, res) => {
  try {
    const { studentId } = req.params;

    const applications = await prisma.application.findMany({
      where: { studentId },
      include: {
        drive: {
          include: {
            company: true,
            rounds: { orderBy: { roundNumber: 'asc' } }
          }
        },
        roundResults: {
          include: { round: true }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    return res.json(applications);
  } catch (error) {
    console.error('getStudentApplications error:', error);
    return res.status(500).json({ error: 'Failed to fetch student applications' });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = [
      'APPLIED',
      'SHORTLISTED',
      'INTERVIEW_SCHEDULED',
      'SELECTED',
      'REJECTED',
      'OFFER_ACCEPTED',
      'WITHDRAWN'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const application = await prisma.application.update({
      where: { id },
      data: {
        status,
        notes: notes !== undefined ? notes : undefined
      },
      include: {
        student: { include: { user: true } },
        drive: { include: { company: true } }
      }
    });

    await createAuditLog(prisma, req.user.id, 'UPDATE_APPLICATION_STATUS', 'Application', id, { status });

    await createNotification(
      prisma,
      application.student.userId,
      'Placement Application Update',
      `Your application for ${application.drive.role} at ${application.drive.company.name} is now: ${status}.`,
      status === 'SELECTED' || status === 'SHORTLISTED' ? 'SUCCESS' : 'INFO',
      '/placement/my-applications'
    );

    return res.json(application);
  } catch (error) {
    console.error('updateApplicationStatus error:', error);
    return res.status(500).json({ error: 'Failed to update application status' });
  }
};

const getAllApplications = async (req, res) => {
  try {
    const { driveId, status, search } = req.query;
    const where = {};
    if (driveId) where.driveId = driveId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { student: { user: { name: { contains: search } } } },
        { student: { rollNumber: { contains: search } } },
        { drive: { role: { contains: search } } },
        { drive: { company: { name: { contains: search } } } }
      ];
    }
    const applications = await prisma.application.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, avatar: true } },
            parsedResume: true
          }
        },
        drive: {
          include: { company: true }
        },
        roundResults: {
          include: { round: true }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });
    return res.json({ data: applications, total: applications.length });
  } catch (error) {
    console.error('getAllApplications error:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

module.exports = {
  applyToDrive,
  withdrawApplication,
  getStudentApplications,
  updateApplicationStatus,
  getAllApplications
};
