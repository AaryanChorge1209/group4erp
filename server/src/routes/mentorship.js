const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const mentorshipController = require('../controllers/mentorshipController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

router.get('/mentors', mentorshipController.getMentors);

router.post(
  '/requests',
  [
    body('alumniId').notEmpty().withMessage('Alumni ID is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  validate,
  mentorshipController.sendRequest
);

router.put(
  '/requests/:id',
  [body('status').isIn(['ACCEPTED', 'DECLINED']).withMessage('Status must be ACCEPTED or DECLINED')],
  validate,
  mentorshipController.respondToRequest
);

router.get('/requests/alumni/:alumniId', mentorshipController.getAlumniRequests);
router.get('/requests/student/:studentId', mentorshipController.getStudentRequests);

router.post(
  '/sessions',
  [
    body('requestId').notEmpty().withMessage('Request ID is required'),
    body('scheduledAt').notEmpty().withMessage('Scheduled date/time is required')
  ],
  validate,
  mentorshipController.createSession
);

router.get('/sessions/:requestId', mentorshipController.getSessionsForRequest);

module.exports = router;
