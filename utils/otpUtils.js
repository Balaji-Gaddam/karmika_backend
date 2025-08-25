const OtpToken = require("../Models/OtpToken");


/**
 * Verify and consume OTP
 * @param {Object} params
 * @param {string} params.email - Email address
 * @param {string} params.userType - "users" | "karmikas"
 * @param {string} params.purpose - "signup" | "profile_update" | "password_reset"
 * @param {string} params.code - OTP code
 */
async function verifyAndConsumeOtp({ email, userType, purpose, code }) {
  try {
    const normalizedEmail = email.toLowerCase();
    const normalizedCode = String(code); // ✅ force string comparison

    console.log("🔍 Verifying OTP with:", {
      email: normalizedEmail,
      userType,
      purpose,
      code: normalizedCode,
    });

    const record = await OtpToken.findOne({
      email: normalizedEmail,
      userType,
      purpose,
      code: normalizedCode,
      consumed: false,
      expiresAt: { $gt: new Date() },
    });

    console.log("📌 Found record:", record);

    if (!record) {
      const err = new Error("OTP not found. Please request a new code.");
      err.status = 400;
      throw err;
    }

    record.consumed = true;
    await record.save();

    console.log("✅ OTP verified and consumed successfully.");
    return true;
  } catch (err) {
    console.error("❌ OTP verification error:", err.message);
    throw err;
  }
}

module.exports = { verifyAndConsumeOtp };


// async function verifyAndConsumeOtp({ email, userType, purpose, code }) {
//   const record = await OtpToken.findOne({
//     email,
//     userType,
//     purpose,
//     code,
//     consumed: false,
//     expiresAt: { $gt: new Date() },
//   });

//   if (!record) {
//     const err = new Error("Invalid or expired OTP");
//     err.status = 400;
//     throw err;
//   }

//   record.consumed = true;
//   await record.save();
// }

// module.exports = { verifyAndConsumeOtp };
