const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const companiesController = require('../../controllers/placement/companiesController');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

router.use(authenticate);

router.get('/', companiesController.getAllCompanies);
router.get('/:id', companiesController.getCompanyById);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Company name is required'),
    body('industry').notEmpty().withMessage('Industry is required'),
    body('email').isEmail().withMessage('Valid email is required')
  ],
  validate,
  companiesController.createCompany
);

router.put('/:id', requireRole('ADMIN', 'PLACEMENT_OFFICER'), companiesController.updateCompany);
router.delete('/:id', requireRole('ADMIN', 'PLACEMENT_OFFICER'), companiesController.deleteCompany);

router.post('/:id/approve', requireRole('ADMIN', 'PLACEMENT_OFFICER'), companiesController.approveCompany);
router.post('/:id/reject', requireRole('ADMIN', 'PLACEMENT_OFFICER'), companiesController.rejectCompany);

module.exports = router;
