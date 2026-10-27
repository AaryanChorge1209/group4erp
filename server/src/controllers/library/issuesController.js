const prisma = require('../../utils/prisma');
const { calculateFine, createAuditLog, createNotification } = require('../../utils/helpers');

const checkoutBook = async (req, res) => {
  try {
    const { barcode, studentId } = req.body;
    if (!barcode) {
      return res.status(400).json({ error: 'Book barcode is required' });
    }

    let targetStudentId = studentId ? String(studentId).trim() : null;
    if (!targetStudentId && req.user) {
      if (req.user.student?.id) {
        targetStudentId = req.user.student.id;
      } else if (req.user.role === 'STUDENT') {
        const s = await prisma.student.findFirst({ where: { userId: req.user.id } });
        if (s) targetStudentId = s.id;
      }
    }

    if (!targetStudentId) {
      return res.status(400).json({ error: 'Student ID or Roll Number is required' });
    }

    // 1. Find book copy
    const copy = await prisma.bookCopy.findUnique({
      where: { barcode },
      include: { book: true }
    });
    if (!copy) {
      return res.status(404).json({ error: `Book copy with barcode "${barcode}" not found` });
    }
    if (copy.status !== 'AVAILABLE') {
      return res.status(400).json({ error: `Book copy is currently ${copy.status}` });
    }

    // 2. Find student
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { id: targetStudentId },
          { userId: targetStudentId },
          { rollNumber: targetStudentId },
          { user: { email: targetStudentId.toLowerCase() } }
        ]
      },
      include: { user: true }
    });
    if (!student) {
      return res.status(404).json({ error: `Student "${targetStudentId}" not found in system` });
    }

    // 3. Check unpaid fines
    const unpaidFines = await prisma.fine.findMany({
      where: {
        studentId: student.id,
        isPaid: false,
        isWaived: false
      }
    });
    if (unpaidFines.length > 0) {
      const totalPending = unpaidFines.reduce((sum, f) => sum + f.amount, 0);
      return res.status(400).json({
        error: `Cannot issue book. Student has unpaid fines totaling ₹${totalPending}.`
      });
    }

    // 4. Determine loan period
    let loanPeriodDays = parseInt(process.env.LOAN_PERIOD_DAYS || '14');
    const loanSetting = await prisma.appSetting.findUnique({ where: { key: 'loanPeriodDays' } });
    if (loanSetting && loanSetting.value) {
      loanPeriodDays = parseInt(loanSetting.value) || loanPeriodDays;
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + loanPeriodDays * 24 * 60 * 60 * 1000);

    // 5. Create issue and update copy
    const issue = await prisma.$transaction(async (tx) => {
      const newIssue = await tx.bookIssue.create({
        data: {
          bookCopyId: copy.id,
          studentId: student.id,
          issuedAt: now,
          dueDate,
          issuedById: req.user.id
        },
        include: {
          bookCopy: { include: { book: true } },
          student: { include: { user: true } }
        }
      });

      await tx.bookCopy.update({
        where: { id: copy.id },
        data: { status: 'ISSUED' }
      });

      return newIssue;
    });

    await createAuditLog(prisma, req.user.id, 'ISSUE_BOOK', 'BookIssue', issue.id, {
      barcode,
      studentRoll: student.rollNumber,
      bookTitle: copy.book.title
    });

    await createNotification(
      prisma,
      student.userId,
      'Book Issued',
      `You have borrowed "${copy.book.title}". Due date: ${dueDate.toISOString().split('T')[0]}.`,
      'INFO',
      '/library/my-books'
    );

    return res.status(201).json({
      message: 'Book checked out successfully',
      issue,
      ...issue
    });
  } catch (error) {
    console.error('checkoutBook error:', error);
    return res.status(500).json({ error: error.message || 'Failed to checkout book' });
  }
};

const returnBook = async (req, res) => {
  try {
    const { barcode } = req.body;
    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required' });
    }

    const copy = await prisma.bookCopy.findUnique({
      where: { barcode },
      include: { book: true }
    });
    if (!copy) {
      return res.status(404).json({ error: `Book copy with barcode "${barcode}" not found` });
    }

    // Find active issue
    const activeIssue = await prisma.bookIssue.findFirst({
      where: {
        bookCopyId: copy.id,
        returnedAt: null
      },
      include: {
        student: { include: { user: true } },
        bookCopy: { include: { book: true } }
      }
    });

    if (!activeIssue) {
      return res.status(400).json({ error: 'No active issue record found for this book copy' });
    }

    // Get fine per day setting
    let finePerDay = parseFloat(process.env.FINE_PER_DAY || '2');
    const fineSetting = await prisma.appSetting.findUnique({ where: { key: 'finePerDay' } });
    if (fineSetting && fineSetting.value) {
      finePerDay = parseFloat(fineSetting.value) || finePerDay;
    }

    const now = new Date();
    const { daysOverdue, amount } = calculateFine(activeIssue.dueDate, now, finePerDay);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark issue returned
      const updatedIssue = await tx.bookIssue.update({
        where: { id: activeIssue.id },
        data: {
          returnedAt: now,
          returnedById: req.user.id
        },
        include: {
          bookCopy: { include: { book: true } },
          student: { include: { user: true } }
        }
      });

      // 2. Create fine if overdue
      let fineRecord = null;
      if (daysOverdue > 0 && amount > 0) {
        fineRecord = await tx.fine.create({
          data: {
            bookIssueId: activeIssue.id,
            studentId: activeIssue.studentId,
            amount,
            daysOverdue,
            isPaid: false
          }
        });
      }

      // 3. Mark copy AVAILABLE
      await tx.bookCopy.update({
        where: { id: copy.id },
        data: { status: 'AVAILABLE' }
      });

      // 4. Check for next pending reservation on this book
      const nextReservation = await tx.reservation.findFirst({
        where: {
          bookId: copy.bookId,
          status: 'PENDING'
        },
        orderBy: { queuePosition: 'asc' },
        include: { student: { include: { user: true } } }
      });

      if (nextReservation) {
        const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        await tx.reservation.update({
          where: { id: nextReservation.id },
          data: {
            status: 'NOTIFIED',
            notifiedAt: now,
            expiresAt
          }
        });

        // Reserve copy status
        await tx.bookCopy.update({
          where: { id: copy.id },
          data: { status: 'RESERVED' }
        });
      }

      return { updatedIssue, fineRecord, nextReservation };
    });

    await createAuditLog(prisma, req.user.id, 'RETURN_BOOK', 'BookIssue', activeIssue.id, {
      barcode,
      daysOverdue,
      fineAmount: amount
    });

    if (result.fineRecord) {
      await createNotification(
        prisma,
        activeIssue.student.userId,
        'Library Overdue Fine Generated',
        `A fine of ₹${amount} was incurred for book "${copy.book.title}" (${daysOverdue} days overdue).`,
        'WARNING',
        '/library/fines'
      );
    }

    if (result.nextReservation && result.nextReservation.student) {
      await createNotification(
        prisma,
        result.nextReservation.student.userId,
        'Reserved Book Available',
        `The book "${copy.book.title}" you reserved is now available! Please collect it within 48 hours.`,
        'SUCCESS',
        '/library/reservations'
      );
    }

    return res.json({
      message: 'Book returned successfully',
      issue: result.updatedIssue,
      fine: result.fineRecord,
      reservationNotified: result.nextReservation ? result.nextReservation.id : null
    });
  } catch (error) {
    console.error('returnBook error:', error);
    return res.status(500).json({ error: error.message || 'Failed to return book' });
  }
};

const getIssues = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { studentId, bookId, status, fromDate, toDate } = req.query;

    const where = {};
    if (studentId) {
      where.studentId = studentId;
    }
    if (bookId) {
      where.bookCopy = { bookId };
    }
    if (status === 'active') {
      where.returnedAt = null;
    } else if (status === 'returned') {
      where.returnedAt = { not: null };
    } else if (status === 'overdue') {
      where.returnedAt = null;
      where.dueDate = { lt: new Date() };
    }

    if (fromDate || toDate) {
      where.issuedAt = {};
      if (fromDate) where.issuedAt.gte = new Date(fromDate);
      if (toDate) where.issuedAt.lte = new Date(toDate);
    }

    const [total, issues] = await Promise.all([
      prisma.bookIssue.count({ where }),
      prisma.bookIssue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
        include: {
          bookCopy: { include: { book: true } },
          student: { include: { user: { select: { name: true, email: true } } } },
          fine: true
        }
      })
    ]);

    const now = new Date();
    const enriched = issues.map((issue) => {
      const isOverdue = !issue.returnedAt && now > new Date(issue.dueDate);
      const daysOverdue = isOverdue
        ? Math.ceil((now.getTime() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        ...issue,
        isOverdue,
        daysOverdue
      };
    });

    return res.json({
      data: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('getIssues error:', error);
    return res.status(500).json({ error: 'Failed to fetch issues' });
  }
};

const getOverdueIssues = async (req, res) => {
  try {
    const now = new Date();
    const overdue = await prisma.bookIssue.findMany({
      where: {
        returnedAt: null,
        dueDate: { lt: now }
      },
      include: {
        bookCopy: { include: { book: true } },
        student: { include: { user: { select: { name: true, email: true } } } },
        fine: true
      },
      orderBy: { dueDate: 'asc' }
    });

    const enriched = overdue.map((issue) => {
      const daysOverdue = Math.ceil((now.getTime() - new Date(issue.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...issue,
        daysOverdue,
        estimatedFine: daysOverdue * 2
      };
    });

    return res.json(enriched);
  } catch (error) {
    console.error('getOverdueIssues error:', error);
    return res.status(500).json({ error: 'Failed to fetch overdue issues' });
  }
};

const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await prisma.bookIssue.findUnique({
      where: { id },
      include: {
        bookCopy: { include: { book: true } },
        student: { include: { user: true } },
        fine: true
      }
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue record not found' });
    }

    return res.json(issue);
  } catch (error) {
    console.error('getIssueById error:', error);
    return res.status(500).json({ error: 'Failed to fetch issue details' });
  }
};

module.exports = {
  checkoutBook,
  returnBook,
  getIssues,
  getOverdueIssues,
  getIssueById
};
