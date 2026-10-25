const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const alumniController = require('../controllers/alumniController');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('rollNumber').notEmpty().withMessage('Roll number is required'),
    body('branch').notEmpty().withMessage('Branch is required'),
    body('batch').isNumeric().withMessage('Batch must be a number'),
    body('graduationYear').isNumeric().withMessage('Graduation year must be a number')
  ],
  validate,
  alumniController.registerAlumni
);

router.use(authenticate);

router.get('/', alumniController.getAllAlumni);
router.get('/:id', alumniController.getAlumniById);
router.put('/:id', alumniController.updateAlumni);
router.post('/:id/verify', requireRole('ADMIN'), alumniController.verifyAlumni);

module.exports = router;
