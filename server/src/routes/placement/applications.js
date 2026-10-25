const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const applicationsController = require('../../controllers/placement/applicationsController');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

router.use(authenticate);

router.post(
  '/',
  [body('driveId').notEmpty().withMessage('Drive ID is required')],
  validate,
  applicationsController.applyToDrive
);

router.delete('/:id', applicationsController.withdrawApplication);
router.get('/student/:studentId', applicationsController.getStudentApplications);
router.get('/', applicationsController.getAllApplications);

router.put(
  '/:id/status',
  requireRole('ADMIN', 'PLACEMENT_OFFICER', 'COMPANY'),
  [body('status').notEmpty().withMessage('Status is required')],
  validate,
  applicationsController.updateApplicationStatus
);

module.exports = router;
