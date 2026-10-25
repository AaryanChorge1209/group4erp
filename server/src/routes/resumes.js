const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const resumesController = require('../controllers/resumesController');
const { authenticate } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/resumes'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.use(authenticate);

router.post('/upload', upload.single('resume'), resumesController.uploadAndParseResume);
router.put('/:id/confirm', resumesController.confirmResume);
router.get('/search', resumesController.searchBySkills);

module.exports = router;
