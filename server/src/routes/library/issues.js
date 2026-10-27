const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const issuesController = require('../../controllers/library/issuesController');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

router.use(authenticate);

router.post(
  '/checkout',
  [
    body('barcode').notEmpty().withMessage('Barcode is required')
  ],
  validate,
  issuesController.checkoutBook
);

router.post(
  '/return',
  [body('barcode').notEmpty().withMessage('Barcode is required')],
  validate,
  issuesController.returnBook
);

router.get('/overdue', issuesController.getOverdueIssues);
router.get('/', issuesController.getIssues);
router.get('/:id', issuesController.getIssueById);

module.exports = router;
