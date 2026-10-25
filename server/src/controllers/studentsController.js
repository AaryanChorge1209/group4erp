const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { createAuditLog } = require('../utils/helpers');

const getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { branch, batch, semester, search } = req.query;

    const where = {};
    if (branch) where.branch = branch;
    if (batch) where.batch = parseInt(batch);
    if (semester) where.semester = parseInt(semester);
    if (search) {
      where.OR = [
        { rollNumber: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } }
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rollNumber: 'asc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, isActive: true }
          }
        }
      })
    ]);

    return res.json({
      data: students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getAllStudents error:', error);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findFirst({
      where: {
        OR: [{ id }, { userId: id }, { rollNumber: id }]
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, isActive: true }
        },
        parsedResume: true
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    return res.json(student);
  } catch (error) {
    console.error('getStudentById error:', error);
    return res.status(500).json({ error: 'Failed to fetch student' });
  }
};

const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password = 'Password@123',
      rollNumber,
      branch,
      batch,
      semester = 1,
      cgpa = 0,
      backlogs = 0,
      phone,
      address,
      skills
    } = req.body;

    if (!email || !name || !rollNumber || !branch || !batch) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
    if (existingRoll) {
      return res.status(400).json({ error: 'Roll number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          role: 'STUDENT'
        }
      });

      return await tx.student.create({
        data: {
          userId: user.id,
          rollNumber,
          branch,
          batch: parseInt(batch),
          semester: parseInt(semester),
          cgpa: parseFloat(cgpa),
          backlogs: parseInt(backlogs),
          phone: phone || null,
          address: address || null,
          skills: skills ? (typeof skills === 'string' ? skills : JSON.stringify(skills)) : null
        },
        include: { user: true }
      });
    });

    await createAuditLog(prisma, req.user.id, 'CREATE_STUDENT', 'Student', student.id);

    return res.status(201).json(student);
  } catch (error) {
    console.error('createStudent error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create student' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      rollNumber,
      branch,
      batch,
      semester,
      cgpa,
      backlogs,
      phone,
      address,
      skills,
      resumeUrl
    } = req.body;

    const student = await prisma.student.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: { user: true }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Role guard: students can only update their own profile; admin/staff can update any
    if (req.user.role === 'STUDENT' && req.user.id !== student.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this student' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({
          where: { id: student.userId },
          data: { name }
        });
      }

      return await tx.student.update({
        where: { id: student.id },
        data: {
          rollNumber: rollNumber || undefined,
          branch: branch || undefined,
          batch: batch ? parseInt(batch) : undefined,
          semester: semester ? parseInt(semester) : undefined,
          cgpa: cgpa !== undefined ? parseFloat(cgpa) : undefined,
          backlogs: backlogs !== undefined ? parseInt(backlogs) : undefined,
          phone: phone !== undefined ? phone : undefined,
          address: address !== undefined ? address : undefined,
          skills: skills ? (typeof skills === 'string' ? skills : JSON.stringify(skills)) : undefined,
          resumeUrl: resumeUrl !== undefined ? resumeUrl : undefined
        },
        include: { user: true }
      });
    });

    await createAuditLog(prisma, req.user.id, 'UPDATE_STUDENT', 'Student', student.id);

    return res.json(updated);
  } catch (error) {
    console.error('updateStudent error:', error);
    return res.status(500).json({ error: 'Failed to update student' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findFirst({
      where: { OR: [{ id }, { userId: id }] }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive: false }
    });

    await createAuditLog(prisma, req.user.id, 'DEACTIVATE_STUDENT', 'Student', student.id);

    return res.json({ message: 'Student deactivated successfully' });
  } catch (error) {
    console.error('deleteStudent error:', error);
    return res.status(500).json({ error: 'Failed to delete student' });
  }
};

const getStudentIssuedBooks = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findFirst({
      where: { OR: [{ id }, { userId: id }] }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const issues = await prisma.bookIssue.findMany({
      where: {
        studentId: student.id,
        returnedAt: null
      },
      include: {
        bookCopy: {
          include: { book: true }
        },
        fine: true
      },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    const enriched = issues.map((issue) => {
      const isOverdue = now > new Date(issue.dueDate);
      const daysOverdue = isOverdue
        ? Math.ceil((now.getTime() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        ...issue,
        isOverdue,
        daysOverdue
      };
    });

    return res.json(enriched);
  } catch (error) {
    console.error('getStudentIssuedBooks error:', error);
    return res.status(500).json({ error: 'Failed to fetch issued books' });
  }
};

const getStudentFines = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findFirst({
      where: { OR: [{ id }, { userId: id }] }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const fines = await prisma.fine.findMany({
      where: { studentId: student.id },
      include: {
        bookIssue: {
          include: {
            bookCopy: { include: { book: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let totalOwed = 0;
    let totalPaid = 0;
    let totalWaived = 0;

    fines.forEach((f) => {
      if (f.isWaived) {
        totalWaived += f.amount;
      } else if (f.isPaid) {
        totalPaid += f.amount;
      } else {
        totalOwed += f.amount;
      }
    });

    return res.json({
      summary: {
        totalOwed,
        totalPaid,
        totalWaived,
        totalFines: totalOwed + totalPaid + totalWaived
      },
      fines
    });
  } catch (error) {
    console.error('getStudentFines error:', error);
    return res.status(500).json({ error: 'Failed to fetch student fines' });
  }
};

const getStudentReservations = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findFirst({
      where: { OR: [{ id }, { userId: id }] }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const reservations = await prisma.reservation.findMany({
      where: { studentId: student.id },
      include: {
        book: {
          include: {
            copies: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(reservations);
  } catch (error) {
    console.error('getStudentReservations error:', error);
    return res.status(500).json({ error: 'Failed to fetch reservations' });
  }
};

const getStudentApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findFirst({
      where: { OR: [{ id }, { userId: id }] }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const applications = await prisma.application.findMany({
      where: { studentId: student.id },
      include: {
        drive: {
          include: {
            company: true,
            rounds: true
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

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentIssuedBooks,
  getStudentFines,
  getStudentReservations,
  getStudentApplications
};
