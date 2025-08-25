// Routes/otpRoutes.js
const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtp } = require("../Controllers/otpController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

module.exports = router;


// const express = require("express");
// const router = express.Router();
// const { sendOtp, verifyOtp, resetPassword } = require("../Controllers/otpController");

// router.post("/send-otp", sendOtp);
// router.post("/verify-otp", verifyOtp);
// router.post("/reset-password", resetPassword); 

// module.exports = router;