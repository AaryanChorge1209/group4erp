const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { createAuditLog } = require('../utils/helpers');

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { role, isActive, search } = req.query;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          student: true,
          staff: true,
          alumni: true,
          companyUser: { include: { company: true } }
        }
      })
    ]);

    return res.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, name, role, avatar, studentData, staffData, alumniData } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, password, name, and role are required' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          role,
          avatar: avatar || null
        }
      });

      if (role === 'STUDENT' && studentData) {
        await tx.student.create({
          data: {
            userId: newUser.id,
            rollNumber: studentData.rollNumber,
            branch: studentData.branch,
            batch: parseInt(studentData.batch),
            semester: parseInt(studentData.semester) || 1,
            cgpa: parseFloat(studentData.cgpa) || 0,
            backlogs: parseInt(studentData.backlogs) || 0,
            phone: studentData.phone || null,
            address: studentData.address || null,
            skills: studentData.skills ? JSON.stringify(studentData.skills) : null
          }
        });
      } else if ((role === 'ADMIN' || role === 'LIBRARIAN' || role === 'PLACEMENT_OFFICER') && staffData) {
        await tx.staff.create({
          data: {
            userId: newUser.id,
            department: staffData.department || 'General',
            designation: staffData.designation || role,
            employeeId: staffData.employeeId
          }
        });
      } else if (role === 'ALUMNI' && alumniData) {
        await tx.alumni.create({
          data: {
            userId: newUser.id,
            rollNumber: alumniData.rollNumber,
            branch: alumniData.branch,
            batch: parseInt(alumniData.batch),
            graduationYear: parseInt(alumniData.graduationYear),
            currentCompany: alumniData.currentCompany || null,
            currentRole: alumniData.currentRole || null,
            location: alumniData.location || null,
            linkedin: alumniData.linkedin || null,
            skills: alumniData.skills ? JSON.stringify(alumniData.skills) : null,
            bio: alumniData.bio || null,
            offersmentoring: !!alumniData.offersmentoring,
            mentoringAreas: alumniData.mentoringAreas ? JSON.stringify(alumniData.mentoringAreas) : null,
            availability: alumniData.availability || null,
            isVerified: true
          }
        });
      }

      return newUser;
    });

    await createAuditLog(prisma, req.user.id, 'CREATE_USER', 'User', user.id, { role: user.role, email: user.email });

    const completeUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { student: true, staff: true, alumni: true }
    });

    const { password: _, ...result } = completeUser;
    return res.status(201).json(result);
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, avatar, isActive, studentData, staffData, alumniData } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const userUpdateData = {};
      if (name !== undefined) userUpdateData.name = name;
      if (role !== undefined) userUpdateData.role = role;
      if (avatar !== undefined) userUpdateData.avatar = avatar;
      if (isActive !== undefined) userUpdateData.isActive = isActive;

      const user = await tx.user.update({
        where: { id },
        data: userUpdateData
      });

      if (studentData && user.role === 'STUDENT') {
        await tx.student.upsert({
          where: { userId: id },
          update: {
            rollNumber: studentData.rollNumber,
            branch: studentData.branch,
            batch: studentData.batch ? parseInt(studentData.batch) : undefined,
            semester: studentData.semester ? parseInt(studentData.semester) : undefined,
            cgpa: studentData.cgpa !== undefined ? parseFloat(studentData.cgpa) : undefined,
            backlogs: studentData.backlogs !== undefined ? parseInt(studentData.backlogs) : undefined,
            phone: studentData.phone,
            address: studentData.address,
            skills: studentData.skills ? JSON.stringify(studentData.skills) : undefined
          },
          create: {
            userId: id,
            rollNumber: studentData.rollNumber,
            branch: studentData.branch || 'CSE',
            batch: parseInt(studentData.batch) || new Date().getFullYear(),
            semester: parseInt(studentData.semester) || 1,
            cgpa: parseFloat(studentData.cgpa) || 0,
            backlogs: parseInt(studentData.backlogs) || 0
          }
        });
      }

      return user;
    });

    await createAuditLog(prisma, req.user.id, 'UPDATE_USER', 'User', id);

    const fullUser = await prisma.user.findUnique({
      where: { id },
      include: { student: true, staff: true, alumni: true }
    });
    const { password: _, ...result } = fullUser;
    return res.json(result);
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    await createAuditLog(prisma, req.user.id, 'DEACTIVATE_USER', 'User', id);

    return res.json({ message: 'User deactivated successfully', id: user.id });
  } catch (error) {
    console.error('deactivateUser error:', error);
    return res.status(500).json({ error: 'Failed to deactivate user' });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { action, entity, userId } = req.query;

    const where = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (userId) where.userId = userId;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      })
    ]);

    return res.json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await prisma.appSetting.findMany();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return res.json({ settings: settingsMap, raw: settings });
  } catch (error) {
    console.error('getSettings error:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

const upsertSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    const updates = Object.entries(settings).map(([key, value]) => {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return prisma.appSetting.upsert({
        where: { key },
        update: { value: stringValue },
        create: { key, value: stringValue }
      });
    });

    await Promise.all(updates);
    await createAuditLog(prisma, req.user.id, 'UPDATE_SETTINGS', 'AppSetting', 'ALL', settings);

    return res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('upsertSettings error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  getAuditLogs,
  getSettings,
  upsertSettings
};
