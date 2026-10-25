const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const digitalController = require('../../controllers/library/digitalController');
const { authenticate, requireRole } = require('../../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../../uploads/digital'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'resource-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.use(authenticate);

router.get('/', digitalController.getDigitalResources);
router.get('/:id', digitalController.getDigitalResourceById);

router.post(
  '/',
  requireRole('ADMIN', 'LIBRARIAN'),
  upload.single('file'),
  digitalController.uploadDigitalResource
);

router.delete('/:id', requireRole('ADMIN', 'LIBRARIAN'), digitalController.deleteDigitalResource);

module.exports = router;
