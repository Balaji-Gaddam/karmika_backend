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

// Routes/authRoutes.js (appenditions)
const OtpControllers = require('../Controllers/Controllers'); // same file holds handlers

// OTP: request during signup (no account yet)
router.post('/otp/request-signup', OtpControllers.requestSignupOtp); // { email, userType: 'users' | 'karmikas' }

// Signup (must include otpCode now)
router.post('/signup', upload.single('image'), OtpControllers.userSignupModelController);

router.post('/karmika/signup', upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'aadharImage', maxCount: 1 }
]), OtpControllers.karmikaSignupModelController);

// OTP: request for profile update (auth required)
router.post('/otp/request-update', OtpControllers.protect, OtpControllers.requestProfileUpdateOtp); // { email }

// Update (must include otpCode in body)
router.patch('/me', OtpControllers.protect, OtpControllers.update);

// OTP: forgot password
router.post('/otp/request-password-reset', OtpControllers.requestPasswordResetOtp); // { email, userType }
router.post('/password/reset', OtpControllers.resetPasswordWithOtp); // { email, userType, otpCode, newPassword }

module.exports = router;