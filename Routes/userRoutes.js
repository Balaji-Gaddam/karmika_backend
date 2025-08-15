const express = require('express');
const router = express.Router();
const Controllers = require('../Controllers/controllers');
const { upload } = require('../Middleware/uploadMiddleware');
const { protect } = require('../Middleware/authMiddleware');

// Protected: check current user
router.get('/check', protect, Controllers.getUser);

// Protected: update user
router.patch('/update', protect, Controllers.update);

// Protected: update profile photo (single file in field 'image')
router.patch('/photo', protect, upload.single('image'), Controllers.photo);

module.exports = router;