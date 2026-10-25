const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const booksController = require('../../controllers/library/booksController');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

// Public OPAC search
router.get('/opac/search', booksController.opacSearch);

// Authenticated routes
router.use(authenticate);

router.get('/stats', booksController.getStats);
router.get('/', booksController.getBooks);
router.get('/:id', booksController.getBookById);

router.post(
  '/',
  requireRole('ADMIN', 'LIBRARIAN'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('author').notEmpty().withMessage('Author is required'),
    body('isbn').notEmpty().withMessage('ISBN is required'),
    body('category').notEmpty().withMessage('Category is required')
  ],
  validate,
  booksController.createBook
);

router.put('/:id', requireRole('ADMIN', 'LIBRARIAN'), booksController.updateBook);
router.delete('/:id', requireRole('ADMIN', 'LIBRARIAN'), booksController.deleteBook);

router.post('/:id/copies', requireRole('ADMIN', 'LIBRARIAN'), booksController.addBookCopy);
router.put('/copies/:copyId', requireRole('ADMIN', 'LIBRARIAN'), booksController.updateBookCopy);

module.exports = router;
