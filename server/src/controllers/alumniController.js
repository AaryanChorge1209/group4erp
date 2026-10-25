const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { createAuditLog } = require('../utils/helpers');

const getAllAlumni = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { batch, branch, company, location, search, offersmentoring } = req.query;

    const where = {};
    if (batch) where.batch = parseInt(batch);
    if (branch) where.branch = branch;
    if (company) where.currentCompany = { contains: company };
    if (location) where.location = { contains: location };
    if (offersmentoring !== undefined) where.offersmentoring = offersmentoring === 'true';

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { currentCompany: { contains: search } },
        { currentRole: { contains: search } },
        { skills: { contains: search } }
      ];
    }

    const [total, alumni] = await Promise.all([
      prisma.alumni.count({ where }),
      prisma.alumni.findMany({
        where,
        skip,
        take: limit,
        orderBy: { graduationYear: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      })
    ]);

    return res.json({
      data: alumni,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getAllAlumni error:', error);
    return res.status(500).json({ error: 'Failed to fetch alumni directory' });
  }
};

const getAlumniById = async (req, res) => {
  try {
    const { id } = req.params;

    const alumni = await prisma.alumni.findFirst({
      where: {
        OR: [{ id }, { userId: id }]
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
        donations: {
          include: { campaign: true },
          orderBy: { date: 'desc' }
        },
        mentorRequests: {
          include: {
            student: { include: { user: { select: { name: true, email: true } } } },
            sessions: true
          }
        }
      }
    });

    if (!alumni) {
      return res.status(404).json({ error: 'Alumni record not found' });
    }

    return res.json(alumni);
  } catch (error) {
    console.error('getAlumniById error:', error);
    return res.status(500).json({ error: 'Failed to fetch alumni details' });
  }
};

const registerAlumni = async (req, res) => {
  try {
    const {
      name,
      email,
      password = 'Password@123',
      rollNumber,
      branch,
      batch,
      graduationYear,
      currentCompany,
      currentRole,
      location,
      linkedin,
      skills,
      bio,
      offersmentoring = false,
      mentoringAreas,
      availability
    } = req.body;

    if (!name || !email || !rollNumber || !branch || !batch || !graduationYear) {
      return res.status(400).json({ error: 'Missing required alumni fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const alumni = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'ALUMNI'
        }
      });

      return await tx.alumni.create({
        data: {
          userId: user.id,
          rollNumber,
          branch,
          batch: parseInt(batch),
          graduationYear: parseInt(graduationYear),
          currentCompany: currentCompany || null,
          currentRole: currentRole || null,
          location: location || null,
          linkedin: linkedin || null,
          skills: skills ? (typeof skills === 'string' ? skills : JSON.stringify(skills)) : null,
          bio: bio || null,
          offersmentoring: !!offersmentoring,
          mentoringAreas: mentoringAreas
            ? typeof mentoringAreas === 'string'
              ? mentoringAreas
              : JSON.stringify(mentoringAreas)
            : null,
          availability: availability || null,
          isVerified: false
        },
        include: { user: true }
      });
    });

    await createAuditLog(prisma, alumni.userId, 'REGISTER_ALUMNI', 'Alumni', alumni.id);

    return res.status(201).json(alumni);
  } catch (error) {
    console.error('registerAlumni error:', error);
    return res.status(500).json({ error: error.message || 'Failed to register alumni' });
  }
};

const updateAlumni = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      currentCompany,
      currentRole,
      location,
      linkedin,
      skills,
      bio,
      offersmentoring,
      mentoringAreas,
      availability
    } = req.body;

    const existing = await prisma.alumni.findFirst({
      where: { OR: [{ id }, { userId: id }] }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Alumni not found' });
    }

    if (req.user.role === 'ALUMNI' && req.user.id !== existing.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { name }
        });
      }

      return await tx.alumni.update({
        where: { id: existing.id },
        data: {
          currentCompany: currentCompany !== undefined ? currentCompany : undefined,
          currentRole: currentRole !== undefined ? currentRole : undefined,
          location: location !== undefined ? location : undefined,
          linkedin: linkedin !== undefined ? linkedin : undefined,
          skills: skills ? (typeof skills === 'string' ? skills : JSON.stringify(skills)) : undefined,
          bio: bio !== undefined ? bio : undefined,
          offersmentoring: offersmentoring !== undefined ? !!offersmentoring : undefined,
          mentoringAreas: mentoringAreas
            ? typeof mentoringAreas === 'string'
              ? mentoringAreas
              : JSON.stringify(mentoringAreas)
            : undefined,
          availability: availability !== undefined ? availability : undefined
        },
        include: { user: true }
      });
    });

    await createAuditLog(prisma, req.user.id, 'UPDATE_ALUMNI', 'Alumni', existing.id);

    return res.json(updated);
  } catch (error) {
    console.error('updateAlumni error:', error);
    return res.status(500).json({ error: 'Failed to update alumni' });
  }
};

const verifyAlumni = async (req, res) => {
  try {
    const { id } = req.params;

    const alumni = await prisma.alumni.update({
      where: { id },
      data: { isVerified: true },
      include: { user: true }
    });

    await createAuditLog(prisma, req.user.id, 'VERIFY_ALUMNI', 'Alumni', id);

    return res.json({ message: 'Alumni verified successfully', alumni });
  } catch (error) {
    console.error('verifyAlumni error:', error);
    return res.status(500).json({ error: 'Failed to verify alumni' });
  }
};

module.exports = {
  getAllAlumni,
  getAlumniById,
  registerAlumni,
  updateAlumni,
  verifyAlumni
};
