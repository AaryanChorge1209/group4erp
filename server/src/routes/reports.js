const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/library/issues', reportsController.getLibraryIssuesReport);
router.get('/library/fines', reportsController.getLibraryFinesReport);
router.get('/placement/summary', reportsController.getPlacementSummary);
router.get('/placement/company-wise', reportsController.getPlacementCompanyWise);
router.get('/alumni/summary', reportsController.getAlumniSummary);
router.get('/donations/summary', reportsController.getDonationsSummary);

module.exports = router;
