const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const uploadCtrl = require('../controllers/uploadController');

// All upload routes require authentication
router.use(auth);

// POST /api/upload — Upload a single file
router.post('/', uploadSingle('file'), uploadCtrl.uploadFile);

module.exports = router;
