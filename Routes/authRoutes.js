const express = require('express');
const router = express.Router();
const Controllers = require('../Controllers/Controllers');
const { upload } = require('../Middleware/uploadMiddleware');

// User signup - expects single file in field 'image'
router.post('/signup', upload.single('image'), Controllers.userSignupModelController);

// Karmika signup - expects fields 'profileImage' and 'aadharImage'
router.post('/karmika/signup', upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'aadharImage', maxCount: 1 }
]), Controllers.karmikaSignupModelController);

// Login
router.post('/login', Controllers.LoginController);

// Get karmikas (public)
router.get('/karmikas', Controllers.getKarmikas);

module.exports = router;