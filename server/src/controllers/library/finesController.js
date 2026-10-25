const prisma = require('../../utils/prisma');
const { generateReceiptNumber, createAuditLog, createNotification } = require('../../utils/helpers');

const getAllFines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, studentId } = req.query; // status: 'paid', 'unpaid', 'waived'

    const where = {};
    if (studentId) where.studentId = studentId;
    if (status === 'paid') {
      where.isPaid = true;
    } else if (status === 'unpaid') {
      where.isPaid = false;
      where.isWaived = false;
    } else if (status === 'waived') {
      where.isWaived = true;
    }

    const [total, fines] = await Promise.all([
      prisma.fine.count({ where }),
      prisma.fine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } }
            }
          },
          bookIssue: {
            include: {
              bookCopy: { include: { book: true } }
            }
          }
        }
      })
    ]);

    return res.json({
      data: fines,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getAllFines error:', error);
    return res.status(500).json({ error: 'Failed to fetch fines' });
  }
};

const payFine = async (req, res) => {
  try {
    const { id } = req.params;

    const fine = await prisma.fine.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        bookIssue: { include: { bookCopy: { include: { book: true } } } }
      }
    });

    if (!fine) {
      return res.status(404).json({ error: 'Fine record not found' });
    }
    if (fine.isPaid) {
      return res.status(400).json({ error: 'Fine has already been paid' });
    }
    if (fine.isWaived) {
      return res.status(400).json({ error: 'Fine has been waived and cannot be paid' });
    }

    const receiptNumber = generateReceiptNumber();
    const paidAt = new Date();

    const updated = await prisma.fine.update({
      where: { id },
      data: {
        isPaid: true,
        paidAt,
        receiptNumber
      }
    });

    await createAuditLog(prisma, req.user.id, 'PAY_FINE', 'Fine', fine.id, {
      amount: fine.amount,
      receiptNumber
    });

    await createNotification(
      prisma,
      fine.student.userId,
      'Fine Paid',
      `Payment of ₹${fine.amount} received. Receipt Number: ${receiptNumber}.`,
      'SUCCESS',
      '/library/fines'
    );

    return res.json({
      message: 'Fine paid successfully',
      fine: updated
    });
  } catch (error) {
    console.error('payFine error:', error);
    return res.status(500).json({ error: 'Failed to process fine payment' });
  }
};

const waiveFine = async (req, res) => {
  try {
    const { id } = req.params;

    const fine = await prisma.fine.findUnique({
      where: { id },
      include: { student: { include: { user: true } } }
    });

    if (!fine) {
      return res.status(404).json({ error: 'Fine record not found' });
    }
    if (fine.isPaid) {
      return res.status(400).json({ error: 'Cannot waive an already paid fine' });
    }
    if (fine.isWaived) {
      return res.status(400).json({ error: 'Fine is already waived' });
    }

    const waivedAt = new Date();
    const updated = await prisma.fine.update({
      where: { id },
      data: {
        isWaived: true,
        waivedAt,
        waivedById: req.user.id
      }
    });

    await createAuditLog(prisma, req.user.id, 'WAIVE_FINE', 'Fine', fine.id, {
      amount: fine.amount
    });

    await createNotification(
      prisma,
      fine.student.userId,
      'Fine Waived',
      `Your library fine of ₹${fine.amount} has been waived by the librarian.`,
      'INFO',
      '/library/fines'
    );

    return res.json({
      message: 'Fine waived successfully',
      fine: updated
    });
  } catch (error) {
    console.error('waiveFine error:', error);
    return res.status(500).json({ error: 'Failed to waive fine' });
  }
};

const getStudentFineSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    const fines = await prisma.fine.findMany({
      where: { studentId },
      include: {
        bookIssue: {
          include: { bookCopy: { include: { book: true } } }
        }
      }
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
      studentId,
      totalOwed,
      totalPaid,
      totalWaived,
      totalFinesCount: fines.length,
      fines
    });
  } catch (error) {
    console.error('getStudentFineSummary error:', error);
    return res.status(500).json({ error: 'Failed to fetch fine summary' });
  }
};

const getFineReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const fines = await prisma.fine.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        bookIssue: { include: { bookCopy: { include: { book: { select: { title: true } } } } } }
      }
    });

    const summary = {
      totalCollected: 0,
      totalWaived: 0,
      totalPending: 0,
      countCollected: 0,
      countWaived: 0,
      countPending: 0
    };

    fines.forEach((f) => {
      if (f.isWaived) {
        summary.totalWaived += f.amount;
        summary.countWaived++;
      } else if (f.isPaid) {
        summary.totalCollected += f.amount;
        summary.countCollected++;
      } else {
        summary.totalPending += f.amount;
        summary.countPending++;
      }
    });

    return res.json({ summary, fines });
  } catch (error) {
    console.error('getFineReport error:', error);
    return res.status(500).json({ error: 'Failed to generate fine report' });
  }
};

module.exports = {
  getAllFines,
  payFine,
  waiveFine,
  getStudentFineSummary,
  getFineReport
};
