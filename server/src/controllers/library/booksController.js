const prisma = require('../../utils/prisma');
const { createAuditLog } = require('../../utils/helpers');

const getBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, category, available } = req.query;

    const where = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } }
      ];
    }
    if (available === 'true') {
      where.copies = {
        some: { status: 'AVAILABLE' }
      };
    }

    const [total, books] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          copies: true,
          _count: {
            select: { reservations: true }
          }
        }
      })
    ]);

    // calculate availability counts per book
    const enriched = books.map((book) => {
      const availableCopies = book.copies.filter((c) => c.status === 'AVAILABLE').length;
      const issuedCopies = book.copies.filter((c) => c.status === 'ISSUED').length;
      return {
        ...book,
        availableCopies,
        issuedCopies
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
    console.error('getBooks error:', error);
    return res.status(500).json({ error: 'Failed to fetch books' });
  }
};

const opacSearch = async (req, res) => {
  try {
    const { q, category } = req.query;
    const where = {};
    if (category) where.category = category;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { author: { contains: q } },
        { isbn: { contains: q } }
      ];
    }

    const books = await prisma.book.findMany({
      where,
      take: 50,
      include: {
        copies: {
          select: { id: true, barcode: true, status: true, condition: true }
        }
      }
    });

    const enriched = books.map((b) => ({
      ...b,
      availableCount: b.copies.filter((c) => c.status === 'AVAILABLE').length,
      totalCount: b.copies.length
    }));

    return res.json(enriched);
  } catch (error) {
    console.error('opacSearch error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
};

const getStats = async (req, res) => {
  try {
    const [totalBooks, totalCopies, issuedCopies, availableCopies, overdueCount, finesAggregate] =
      await Promise.all([
        prisma.book.count(),
        prisma.bookCopy.count(),
        prisma.bookCopy.count({ where: { status: 'ISSUED' } }),
        prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
        prisma.bookIssue.count({
          where: {
            returnedAt: null,
            dueDate: { lt: new Date() }
          }
        }),
        prisma.fine.aggregate({
          _sum: { amount: true },
          where: { isPaid: false, isWaived: false }
        })
      ]);

    const totalUnpaidFines = finesAggregate._sum.amount || 0;

    return res.json({
      totalBooks,
      totalCopies,
      issuedCopies,
      availableCopies,
      overdueCount,
      totalUnpaidFines
    });
  } catch (error) {
    console.error('getStats error:', error);
    return res.status(500).json({ error: 'Failed to fetch library statistics' });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        copies: {
          include: {
            issues: {
              where: { returnedAt: null },
              include: {
                student: {
                  include: { user: { select: { name: true, email: true } } }
                }
              }
            }
          }
        },
        reservations: {
          where: { status: 'PENDING' },
          include: {
            student: {
              include: { user: { select: { name: true, email: true } } }
            }
          },
          orderBy: { queuePosition: 'asc' }
        }
      }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.json(book);
  } catch (error) {
    console.error('getBookById error:', error);
    return res.status(500).json({ error: 'Failed to fetch book detail' });
  }
};

const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      publisher,
      edition,
      language = 'English',
      description,
      coverUrl,
      shelfLocation,
      initialCopies = 1
    } = req.body;

    if (!title || !author || !isbn || !category) {
      return res.status(400).json({ error: 'Title, author, ISBN, and category are required' });
    }

    const existing = await prisma.book.findUnique({ where: { isbn } });
    if (existing) {
      return res.status(400).json({ error: 'Book with this ISBN already exists' });
    }

    const copiesCount = parseInt(initialCopies) || 1;

    const book = await prisma.$transaction(async (tx) => {
      const newBook = await tx.book.create({
        data: {
          title,
          author,
          isbn,
          category,
          publisher: publisher || null,
          edition: edition || null,
          language,
          description: description || null,
          coverUrl: coverUrl || null,
          shelfLocation: shelfLocation || null,
          totalCopies: copiesCount
        }
      });

      // generate copies with unique barcodes
      const copyPromises = [];
      const timestamp = Date.now().toString().slice(-4);
      for (let i = 1; i <= copiesCount; i++) {
        const barcode = `BC-${newBook.id.slice(-4).toUpperCase()}-${timestamp}-${i}`;
        copyPromises.push(
          tx.bookCopy.create({
            data: {
              bookId: newBook.id,
              barcode,
              status: 'AVAILABLE',
              condition: 'GOOD'
            }
          })
        );
      }
      await Promise.all(copyPromises);

      return newBook;
    });

    await createAuditLog(prisma, req.user.id, 'CREATE_BOOK', 'Book', book.id, { title: book.title, isbn: book.isbn });

    const completeBook = await prisma.book.findUnique({
      where: { id: book.id },
      include: { copies: true }
    });

    return res.status(201).json(completeBook);
  } catch (error) {
    console.error('createBook error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create book' });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, category, publisher, edition, language, description, coverUrl, shelfLocation } =
      req.body;

    const book = await prisma.book.update({
      where: { id },
      data: {
        title,
        author,
        isbn,
        category,
        publisher,
        edition,
        language,
        description,
        coverUrl,
        shelfLocation
      },
      include: { copies: true }
    });

    await createAuditLog(prisma, req.user.id, 'UPDATE_BOOK', 'Book', book.id);

    return res.json(book);
  } catch (error) {
    console.error('updateBook error:', error);
    return res.status(500).json({ error: 'Failed to update book' });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by marking all copies LOST
    await prisma.bookCopy.updateMany({
      where: { bookId: id },
      data: { status: 'LOST' }
    });

    await createAuditLog(prisma, req.user.id, 'SOFT_DELETE_BOOK', 'Book', id);

    return res.json({ message: 'Book copies marked as lost/deleted' });
  } catch (error) {
    console.error('deleteBook error:', error);
    return res.status(500).json({ error: 'Failed to delete book' });
  }
};

const addBookCopy = async (req, res) => {
  try {
    const { id } = req.params;
    const { condition = 'GOOD', rfidTag } = req.body;

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const totalCopiesCount = await prisma.bookCopy.count({ where: { bookId: id } });
    const barcode = `BC-${book.isbn.slice(-4)}-${totalCopiesCount + 1}-${Date.now().toString().slice(-3)}`;

    const copy = await prisma.$transaction(async (tx) => {
      const newCopy = await tx.bookCopy.create({
        data: {
          bookId: id,
          barcode,
          condition,
          rfidTag: rfidTag || null,
          status: 'AVAILABLE'
        }
      });

      await tx.book.update({
        where: { id },
        data: { totalCopies: { increment: 1 } }
      });

      return newCopy;
    });

    await createAuditLog(prisma, req.user.id, 'ADD_BOOK_COPY', 'BookCopy', copy.id);

    return res.status(201).json(copy);
  } catch (error) {
    console.error('addBookCopy error:', error);
    return res.status(500).json({ error: 'Failed to add book copy' });
  }
};

const updateBookCopy = async (req, res) => {
  try {
    const { copyId } = req.params;
    const { status, condition, barcode, rfidTag } = req.body;

    const updated = await prisma.bookCopy.update({
      where: { id: copyId },
      data: {
        status: status || undefined,
        condition: condition || undefined,
        barcode: barcode || undefined,
        rfidTag: rfidTag || undefined
      }
    });

    await createAuditLog(prisma, req.user.id, 'UPDATE_BOOK_COPY', 'BookCopy', copyId);

    return res.json(updated);
  } catch (error) {
    console.error('updateBookCopy error:', error);
    return res.status(500).json({ error: 'Failed to update book copy' });
  }
};

module.exports = {
  getBooks,
  opacSearch,
  getStats,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  addBookCopy,
  updateBookCopy
};
