const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const roundsController = require('../../controllers/placement/roundsController');
const { authenticate, requireRole } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

router.use(authenticate, requireRole('ADMIN', 'PLACEMENT_OFFICER', 'COMPANY'));

router.post(
  '/',
  [
    body('driveId').notEmpty().withMessage('Drive ID is required'),
    body('roundNumber').isNumeric().withMessage('Round number must be a number'),
    body('roundType').notEmpty().withMessage('Round type is required')
  ],
  validate,
  roundsController.createRound
);

router.put('/:id', roundsController.updateRound);
router.post('/:id/results', roundsController.updateBulkRoundResults);

module.exports = router;
