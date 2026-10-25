const express = require('express');
const router = express.Router();
const remindersController = require('../../controllers/library/remindersController');
const { authenticate, requireRole } = require('../../middleware/auth');

router.use(authenticate, requireRole('ADMIN', 'LIBRARIAN'));

router.post('/send', remindersController.triggerReminders);
router.get('/logs', remindersController.getReminderLogs);

module.exports = router;
