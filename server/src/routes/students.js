const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const studentsController = require('../controllers/studentsController');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/', studentsController.getAllStudents);

router.get('/:id', studentsController.getStudentById);

router.post(
  '/',
  requireRole('ADMIN'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('rollNumber').notEmpty().withMessage('Roll number is required'),
    body('branch').notEmpty().withMessage('Branch is required'),
    body('batch').isNumeric().withMessage('Batch must be a number')
  ],
  validate,
  studentsController.createStudent
);

router.put('/:id', studentsController.updateStudent);

router.delete('/:id', requireRole('ADMIN'), studentsController.deleteStudent);

router.get('/:id/issued-books', studentsController.getStudentIssuedBooks);

router.get('/:id/fines', studentsController.getStudentFines);

router.get('/:id/reservations', studentsController.getStudentReservations);

router.get('/:id/applications', studentsController.getStudentApplications);

module.exports = router;
