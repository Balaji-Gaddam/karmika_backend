const { userSignupModel, karmikaSignupModel } = require("../Models/Models");
const { generateOtp,otpHtml} = require("../utils/otp");

const OtpToken = require("../Models/OtpToken");
const { sendEmail } = require("../utils/mailer");


const OTP_TTL_MINUTES = 10;

// ✅ Send OTP
const sendOtp = async (req, res) => {
  try {
    const { email, userType, purpose } = req.body;

    if (!email || !userType) {
      return res.status(400).json({ status: "fail", message: "Email and userType are required" });
    }

    const otpCode = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    await OtpToken.create({
      email: email.toLowerCase(),
      userType,
      purpose: purpose || "signup",
      code: otpCode,
      expiresAt,
    });

    // ✅ Correct usage
    await sendEmail({
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otpCode}. It will expire in 5 minutes.`,
      html: `<p>Your OTP is <b>${otpCode}</b>. It will expire in 5 minutes.</p>`,
    });

    return res.json({ status: "success", message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ status: "error", message: "Failed to send OTP" , error:err.message});
  }
};


// ✅ Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, userType, purpose, code } = req.body;
    if (!email || !userType || !purpose || !code) {
      return res.status(400).json({ status: "fail", message: "Missing required fields" });
    }

    const otpDoc = await OtpToken.findOne({
      email,
      userType,
      purpose,
      code,
      consumed: false,
      expiresAt: { $gt: Date.now() },
    });

    if (!otpDoc) {
      return res.status(400).json({ status: "fail", message: "Invalid or expired OTP" });
    }

    otpDoc.consumed = true;
    await otpDoc.save();

    return res.json({ status: "success", message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ status: "error", message: "OTP verification failed" });
  }
};



// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, userType } = req.body;
    if (!email || !userType) {
      return res.status(400).json({ status: "fail", message: "email and userType are required" });
    }
    if (!["users", "karmikas"].includes(userType)) {
      return res.status(400).json({ status: "fail", message: "Invalid userType" });
    }

    const exists =
      userType === "users"
        ? await userSignupModel.findOne({ email: email.toLowerCase() })
        : await karmikaSignupModel.findOne({ email: email.toLowerCase() });

    if (!exists) {
      return res.status(200).json({ status: "success", message: "If the account exists, an OTP has been sent" });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await OtpToken.create({
      email: email.toLowerCase(),
      userId: exists._id,
      userType,
      purpose: "password_reset",
      code,
      expiresAt,
    });

    await sendEmail({
      to: email,
      subject: "Your Karmika password reset code",
      html: otpHtml(code, OTP_TTL_MINUTES),
      text: `Your OTP is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    });

    return res.status(200).json({ status: "success", message: "If the account exists, an OTP has been sent" });
  } catch (err) {
    console.error("requestPasswordResetOtp error:", err);
    return res.status(err.status || 500).json({ status: "error", message: err.message || "Internal server error" });
  }
};

module.exports = { sendOtp, verifyOtp, resetPassword };
