const express = require('express');
const router = express.Router();
const finesController = require('../../controllers/library/finesController');
const { authenticate, requireRole } = require('../../middleware/auth');

router.use(authenticate);

router.get('/report', requireRole('ADMIN', 'LIBRARIAN'), finesController.getFineReport);
router.get('/student/:studentId/summary', finesController.getStudentFineSummary);
router.get('/', finesController.getAllFines);

router.post('/:id/pay', requireRole('ADMIN', 'LIBRARIAN'), finesController.payFine);
router.post('/:id/waive', requireRole('ADMIN', 'LIBRARIAN'), finesController.waiveFine);

module.exports = router;
