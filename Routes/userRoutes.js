const express = require('express');
const router = express.Router();
const Controllers = require('../Controllers/Controllers');
const { upload } = require('../Middleware/uploadMiddleware');
const { protect } = require('../Middleware/authMiddleware');

// Protected: check current user
router.get('/check', protect, Controllers.getUser);

// Protected: update user
router.patch('/update', protect, Controllers.update);


module.exports = router;