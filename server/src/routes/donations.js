const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const donationsController = require('../controllers/donationsController');
const { authenticate, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/campaigns', donationsController.getCampaigns);
router.get('/leaderboard', donationsController.getLeaderboard);
router.get('/:id/receipt', donationsController.getReceipt);
router.get('/', donationsController.getAllDonations);

router.post(
  '/',
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('purpose').notEmpty().withMessage('Purpose is required')
  ],
  validate,
  donationsController.recordDonation
);

router.post(
  '/campaigns',
  requireRole('ADMIN'),
  [
    body('title').notEmpty().withMessage('Campaign title is required'),
    body('goalAmount').isNumeric().withMessage('Goal amount is required'),
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('endDate').notEmpty().withMessage('End date is required')
  ],
  validate,
  donationsController.createCampaign
);

router.put('/campaigns/:id', requireRole('ADMIN'), donationsController.updateCampaign);

module.exports = router;
