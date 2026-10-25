const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const drivesController = require('../../controllers/placement/drivesController');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

router.use(authenticate);

router.get('/', drivesController.getDrives);
router.get('/:id', drivesController.getDriveById);
router.get('/:id/eligible-students', drivesController.getEligibleStudents);
router.get('/:id/applicants', drivesController.getDriveApplicants);

router.post(
  '/',
  requireRole('ADMIN', 'PLACEMENT_OFFICER'),
  [
    body('companyId').notEmpty().withMessage('Company ID is required'),
    body('role').notEmpty().withMessage('Role is required'),
    body('ctc').isNumeric().withMessage('CTC must be a number'),
    body('driveDate').notEmpty().withMessage('Drive date is required'),
    body('lastDateApply').notEmpty().withMessage('Last date to apply is required'),
    body('batchYear').isNumeric().withMessage('Batch year must be a number')
  ],
  validate,
  drivesController.createDrive
);

router.put('/:id', requireRole('ADMIN', 'PLACEMENT_OFFICER'), drivesController.updateDrive);

module.exports = router;
