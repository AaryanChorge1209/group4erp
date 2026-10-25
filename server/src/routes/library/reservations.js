const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const reservationsController = require('../../controllers/library/reservationsController');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

router.use(authenticate);

router.post(
  '/',
  [body('bookId').notEmpty().withMessage('Book ID is required')],
  validate,
  reservationsController.createReservation
);

router.delete('/:id', reservationsController.cancelReservation);
router.get('/book/:bookId', reservationsController.getBookReservations);
router.get('/student/:studentId', reservationsController.getStudentReservations);
router.get('/', reservationsController.getAllReservations);
router.post('/:id/notify', reservationsController.notifyNext);

module.exports = router;
