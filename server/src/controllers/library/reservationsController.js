const prisma = require('../../utils/prisma');
const { createAuditLog } = require('../../utils/helpers');

const createReservation = async (req, res) => {
  try {
    const { bookId, studentId: rawStudentId } = req.body;
    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    // Determine target student
    let studentId = rawStudentId;
    if (req.user.role === 'STUDENT') {
      if (!req.user.student) {
        return res.status(400).json({ error: 'Student record not found for this user' });
      }
      studentId = req.user.student.id;
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: { copies: true }
    });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if student currently has an active copy of this book
    const existingActiveIssue = await prisma.bookIssue.findFirst({
      where: {
        studentId,
        returnedAt: null,
        bookCopy: { bookId }
      }
    });
    if (existingActiveIssue) {
      return res.status(400).json({ error: 'Student already has an active issue of this book' });
    }

    // Check if student already has a pending or notified reservation
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        bookId,
        studentId,
        status: { in: ['PENDING', 'NOTIFIED'] }
      }
    });
    if (existingReservation) {
      return res.status(400).json({ error: 'Student already has an active reservation for this book' });
    }

    // Find current max queue position
    const lastReservation = await prisma.reservation.findFirst({
      where: {
        bookId,
        status: { in: ['PENDING', 'NOTIFIED'] }
      },
      orderBy: { queuePosition: 'desc' }
    });

    const nextPosition = lastReservation ? lastReservation.queuePosition + 1 : 1;

    const reservation = await prisma.reservation.create({
      data: {
        bookId,
        studentId,
        queuePosition: nextPosition,
        status: 'PENDING'
      },
      include: {
        book: true,
        student: { include: { user: true } }
      }
    });

    await createAuditLog(prisma, req.user.id, 'CREATE_RESERVATION', 'Reservation', reservation.id, {
      bookTitle: book.title,
      queuePosition: nextPosition
    });

    return res.status(201).json(reservation);
  } catch (error) {
    console.error('createReservation error:', error);
    return res.status(500).json({ error: 'Failed to create reservation' });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const { bookId, queuePosition } = reservation;

    await prisma.$transaction(async (tx) => {
      // Delete or mark cancelled
      await tx.reservation.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      // Shift subsequent positions down by 1
      await tx.reservation.updateMany({
        where: {
          bookId,
          status: 'PENDING',
          queuePosition: { gt: queuePosition }
        },
        data: {
          queuePosition: { decrement: 1 }
        }
      });
    });

    await createAuditLog(prisma, req.user.id, 'CANCEL_RESERVATION', 'Reservation', id);

    return res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('cancelReservation error:', error);
    return res.status(500).json({ error: 'Failed to cancel reservation' });
  }
};

const getBookReservations = async (req, res) => {
  try {
    const { bookId } = req.params;

    const reservations = await prisma.reservation.findMany({
      where: {
        bookId,
        status: { in: ['PENDING', 'NOTIFIED'] }
      },
      orderBy: { queuePosition: 'asc' },
      include: {
        student: {
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });

    return res.json(reservations);
  } catch (error) {
    console.error('getBookReservations error:', error);
    return res.status(500).json({ error: 'Failed to fetch book reservations' });
  }
};

const getStudentReservations = async (req, res) => {
  try {
    const { studentId } = req.params;

    const reservations = await prisma.reservation.findMany({
      where: { studentId },
      include: {
        book: {
          include: { copies: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(reservations);
  } catch (error) {
    console.error('getStudentReservations error:', error);
    return res.status(500).json({ error: 'Failed to fetch student reservations' });
  }
};

const getAllReservations = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { book: { title: { contains: search } } },
        { student: { user: { name: { contains: search } } } },
        { student: { rollNumber: { contains: search } } }
      ];
    }
    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        book: true,
        student: {
          include: { user: { select: { name: true, email: true } } }
        }
      },
      orderBy: [{ bookId: 'asc' }, { queuePosition: 'asc' }]
    });
    return res.json({ data: reservations, total: reservations.length });
  } catch (error) {
    console.error('getAllReservations error:', error);
    return res.status(500).json({ error: 'Failed to fetch all reservations' });
  }
};

const notifyNext = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: 'NOTIFIED' },
      include: {
        student: { include: { user: true } },
        book: true
      }
    });
    return res.json({ message: 'Next in queue notified', reservation });
  } catch (error) {
    console.error('notifyNext error:', error);
    return res.status(500).json({ error: 'Failed to notify reservation' });
  }
};

module.exports = {
  createReservation,
  cancelReservation,
  getBookReservations,
  getStudentReservations,
  getAllReservations,
  notifyNext
};

