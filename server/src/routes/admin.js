const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Admin only routes
router.use(authenticate, requireRole('ADMIN'));

router.get('/users', adminController.getUsers);

router.post(
  '/users',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role').isIn(['ADMIN', 'LIBRARIAN', 'STUDENT', 'PLACEMENT_OFFICER', 'COMPANY', 'ALUMNI']).withMessage('Valid role is required')
  ],
  validate,
  adminController.createUser
);

router.put('/users/:id', adminController.updateUser);

router.delete('/users/:id', adminController.deactivateUser);

router.get('/audit-logs', adminController.getAuditLogs);

router.get('/settings', adminController.getSettings);

router.put('/settings', adminController.upsertSettings);

module.exports = router;
