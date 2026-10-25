const prisma = require('../../utils/prisma');
const { createAuditLog } = require('../../utils/helpers');

const getDrives = async (req, res) => {
  try {
    const { status, companyId, batchYear } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (companyId) where.companyId = companyId;
    if (batchYear) where.batchYear = parseInt(batchYear);

    const [total, drives] = await Promise.all([
      prisma.placementDrive.count({ where }),
      prisma.placementDrive.findMany({
        where,
        skip,
        take: limit,
        orderBy: { driveDate: 'desc' },
        include: {
          company: true,
          rounds: { orderBy: { roundNumber: 'asc' } },
          _count: { select: { applications: true } }
        }
      })
    ]);

    return res.json({
      data: drives,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('getDrives error:', error);
    return res.status(500).json({ error: 'Failed to fetch placement drives' });
  }
};


const getDriveById = async (req, res) => {
  try {
    const { id } = req.params;

    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: {
        company: true,
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            results: true
          }
        },
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' });
    }

    return res.json(drive);
  } catch (error) {
    console.error('getDriveById error:', error);
    return res.status(500).json({ error: 'Failed to fetch drive details' });
  }
};

const createDrive = async (req, res) => {
  try {
    const {
      companyId,
      role,
      ctc,
      driveDate,
      venue,
      mode = 'OFFLINE',
      lastDateApply,
      minCgpa = 0,
      maxBacklogs = 0,
      allowedBranches, // array or stringified JSON
      batchYear,
      description,
      status = 'UPCOMING'
    } = req.body;

    if (!companyId || !role || !ctc || !driveDate || !lastDateApply || !batchYear) {
      return res.status(400).json({ error: 'Missing required drive fields' });
    }

    const branchesString = Array.isArray(allowedBranches)
      ? JSON.stringify(allowedBranches)
      : typeof allowedBranches === 'string'
      ? allowedBranches
      : '["CSE","ECE","IT"]';

    const drive = await prisma.placementDrive.create({
      data: {
        companyId,
        role,
        ctc: parseFloat(ctc),
        driveDate: new Date(driveDate),
        venue: venue || null,
        mode,
        lastDateApply: new Date(lastDateApply),
        minCgpa: parseFloat(minCgpa),
        maxBacklogs: parseInt(maxBacklogs),
        allowedBranches: branchesString,
        batchYear: parseInt(batchYear),
        description: description || null,
        status,
        createdBy: req.user.id
      },
      include: { company: true }
    });

    await createAuditLog(prisma, req.user.id, 'CREATE_DRIVE', 'PlacementDrive', drive.id, {
      role: drive.role,
      company: drive.company.name
    });

    return res.status(201).json(drive);
  } catch (error) {
    console.error('createDrive error:', error);
    return res.status(500).json({ error: 'Failed to create placement drive' });
  }
};

const updateDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      role,
      ctc,
      driveDate,
      venue,
      mode,
      lastDateApply,
      minCgpa,
      maxBacklogs,
      allowedBranches,
      batchYear,
      status,
      description
    } = req.body;

    const data = {};
    if (role !== undefined) data.role = role;
    if (ctc !== undefined) data.ctc = parseFloat(ctc);
    if (driveDate !== undefined) data.driveDate = new Date(driveDate);
    if (venue !== undefined) data.venue = venue;
    if (mode !== undefined) data.mode = mode;
    if (lastDateApply !== undefined) data.lastDateApply = new Date(lastDateApply);
    if (minCgpa !== undefined) data.minCgpa = parseFloat(minCgpa);
    if (maxBacklogs !== undefined) data.maxBacklogs = parseInt(maxBacklogs);
    if (allowedBranches !== undefined) {
      data.allowedBranches = Array.isArray(allowedBranches)
        ? JSON.stringify(allowedBranches)
        : String(allowedBranches);
    }
    if (batchYear !== undefined) data.batchYear = parseInt(batchYear);
    if (status !== undefined) data.status = status;
    if (description !== undefined) data.description = description;

    const drive = await prisma.placementDrive.update({
      where: { id },
      data,
      include: { company: true }
    });

    await createAuditLog(prisma, req.user.id, 'UPDATE_DRIVE', 'PlacementDrive', id);

    return res.json(drive);
  } catch (error) {
    console.error('updateDrive error:', error);
    return res.status(500).json({ error: 'Failed to update drive' });
  }
};

const getEligibleStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const drive = await prisma.placementDrive.findUnique({
      where: { id }
    });
    if (!drive) {
      return res.status(404).json({ error: 'Drive not found' });
    }

    let allowedBranches = [];
    try {
      allowedBranches = JSON.parse(drive.allowedBranches);
    } catch (e) {
      allowedBranches = [drive.allowedBranches];
    }

    // Filter students
    const students = await prisma.student.findMany({
      where: {
        batch: drive.batchYear,
        branch: { in: allowedBranches },
        cgpa: { gte: drive.minCgpa },
        backlogs: { lte: drive.maxBacklogs }
      },
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        applications: {
          where: { driveId: id }
        }
      }
    });

    const enriched = students.map((s) => ({
      ...s,
      hasApplied: s.applications.length > 0,
      applicationStatus: s.applications.length > 0 ? s.applications[0].status : null
    }));

    return res.json({
      driveId: id,
      totalEligible: enriched.length,
      students: enriched
    });
  } catch (error) {
    console.error('getEligibleStudents error:', error);
    return res.status(500).json({ error: 'Failed to fetch eligible students' });
  }
};

const getDriveApplicants = async (req, res) => {
  try {
    const { id } = req.params;

    const applications = await prisma.application.findMany({
      where: { driveId: id },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, avatar: true } },
            parsedResume: true
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
    console.error('getDriveApplicants error:', error);
    return res.status(500).json({ error: 'Failed to fetch applicants' });
  }
};

module.exports = {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive,
  getEligibleStudents,
  getDriveApplicants
};
