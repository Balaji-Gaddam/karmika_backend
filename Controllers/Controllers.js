const { userSignupModel, karmikaSignupModel } = require("../Models/Models");
const OtpToken = require("../Models/OtpToken");
const bcryptJs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const streamifier = require("streamifier");
const cloudinary = require("cloudinary").v2;
const { isGmailAddress } = require("../utils/validation");
const { sendEmail } = require("../utils/mailer");
const { generateOtp, otpHtml } = require("../utils/otp");


const { verifyAndConsumeOtp } = require("../utils/otpUtils");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "1d";
const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || "10", 10);

if (!JWT_SECRET) {
  console.error("JWT_SECRET not set in env");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const uploadBufferToCloudinary = (buffer, folder = "") => {
  return new Promise((resolve, reject) => {
    const upload_stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => (result ? resolve(result) : reject(error))
    );
    streamifier.createReadStream(buffer).pipe(upload_stream);
  });
};

// -------------------- OTP Request Handlers --------------------
const requestSignupOtp = async (req, res) => {
  try {
    const { email, userType } = req.body;
    if (!email || !userType) {
      return res.status(400).json({ status: "fail", message: "email and userType are required" });
    }
    if (!isGmailAddress(email)) {
      return res.status(400).json({ status: "fail", message: "Email must be a Gmail account." });
    }
    if (!["users", "karmikas"].includes(userType)) {
      return res.status(400).json({ status: "fail", message: "Invalid userType" });
    }

    // Block if email already exists
    const existing =
      userType === "users"
        ? await userSignupModel.findOne({ email: email.toLowerCase() })
        : await karmikaSignupModel.findOne({ email: email.toLowerCase() });

    if (existing) {
      return res.status(409).json({ status: "fail", message: "Account already exists with this email" });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await OtpToken.create({ email: email.toLowerCase(), userType, purpose: "signup", code, expiresAt });

    await sendEmail({
      to: email,
      subject: "Your Karmika signup OTP",
      html: otpHtml(code, OTP_TTL_MINUTES),
      text: `Your OTP is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    });

    return res.status(200).json({ status: "success", message: "OTP sent to email" });
  } catch (err) {
    console.error("requestSignupOtp error:", err);
    return res.status(err.status || 500).json({ status: "error", message: err.message || "Internal server error" });
  }
};

const requestProfileUpdateOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const current = req.user;
    const userType = current.profileImage ? "karmikas" : "users";

    const targetEmail = (email || current.email).toLowerCase();
    if (!isGmailAddress(targetEmail)) {
      return res.status(400).json({ status: "fail", message: "Email must be a Gmail account." });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await OtpToken.create({ email: targetEmail, userId: current._id, userType, purpose: "profile_update", code, expiresAt });

    await sendEmail({
      to: targetEmail,
      subject: "Your Karmika update verification code",
      html: otpHtml(code, OTP_TTL_MINUTES),
      text: `Your OTP is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    });

    return res.status(200).json({ status: "success", message: "OTP sent to email" });
  } catch (err) {
    console.error("requestProfileUpdateOtp error:", err);
    return res.status(err.status || 500).json({ status: "error", message: err.message || "Internal server error" });
  }
};

const requestPasswordResetOtp = async (req, res) => {
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
    await OtpToken.create({ email: email.toLowerCase(), userId: exists._id, userType, purpose: "password_reset", code, expiresAt });

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

// USER SIGNUP
const userSignupModelController = async (req, res) => {
  try {
    const { Username, email, password, contact, otpCode } = req.body;

    if (!otpCode) return res.status(400).json({ status: "fail", message: "OTP code is required" });

    await verifyAndConsumeOtp({ email, userType: "users", purpose: "signup", code: otpCode });

    const existingUser = await userSignupModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ status: "fail", message: "User already exists" });
    }

    if (!req.file) return res.status(400).json({ status: "fail", message: "No file uploaded" });

    const hashPassword = bcryptJs.hashSync(password);
    const uploaded = await uploadBufferToCloudinary(req.file.buffer, "karmika/profiles");

    const newUser = await userSignupModel.create({
      Username,
      email: email.toLowerCase(),
      password: hashPassword,
      contact,
      image: uploaded.secure_url,
    });

    const token = signToken(newUser._id);
    const safeUser = newUser.toObject();
    delete safeUser.password;

    return res.status(201).json({
      status: "success",
      message: "user signup successfully",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Error during signup", error);
    return res.status(error.status || 500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

// KARMIKA SIGNUP
const karmikaSignupModelController = async (req, res) => {
  try {
    const { name, email, contact, workType, price, address, password, otpCode } = req.body;

    if (!otpCode) return res.status(400).json({ status: "fail", message: "OTP code is required" });

    await verifyAndConsumeOtp({ email, userType: "karmikas", purpose: "signup", code: otpCode });

    const existingUser = await karmikaSignupModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ status: "fail", message: "Sorry user already existed" });
    }

    if (!req.files) return res.status(400).json({ status: "fail", message: "No files uploaded" });

    const profileFile = req.files["profileImage"]?.[0];
    const aadharFile = req.files["aadharImage"]?.[0];
    if (!profileFile || !aadharFile) {
      return res.status(400).json({ status: "fail", message: "Profile and Aadhar images are required" });
    }

    const hashPassword = bcryptJs.hashSync(password);
    const uploadedProfile = await uploadBufferToCloudinary(profileFile.buffer, "karmika/profiles");
    const uploadedAadhar = await uploadBufferToCloudinary(aadharFile.buffer, "karmika/aadhar");

    const newKarmika = await karmikaSignupModel.create({
      name,
      email: email.toLowerCase(),
      contact,
      profileImage: uploadedProfile.secure_url,
      workType,
      price,
      address,
      aadharImage: uploadedAadhar.secure_url,
      password: hashPassword,
    });

    const safeUser = newKarmika.toObject();
    delete safeUser.password;

    return res.status(201).json({ status: "success", message: "Karmika signed up successfully", user: safeUser });
  } catch (error) {
    console.error("Error during Karmika signup:", error);
    return res.status(error.status || 500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

// -------------------- Login --------------------
const LoginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await userSignupModel.findOne({ email: email.toLowerCase() });
    const existingKarmika = await karmikaSignupModel.findOne({ email: email.toLowerCase() });

    const account = existingUser || existingKarmika;
    if (!account) return res.status(404).json({ status: "fail", message: "User not found" });

    const ok = bcryptJs.compareSync(password, account.password);
    if (!ok) return res.status(400).json({ status: "fail", message: "Invalid credentials" });

    const token = signToken(account._id);
    const safeUser = account.toObject();
    delete safeUser.password;

    return res.status(200).json({ status: "success", message: "User logged in successfully", token, user: safeUser });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ status: "error", message: "Error during login" });
  }
};

// -------------------- Get Karmikas --------------------
const getKarmikas = async (req, res) => {
  try {
    const Karmikas = await karmikaSignupModel.find();
    return res.status(200).json({ status: "success", data: Karmikas });
  } catch (error) {
    console.error("error fetching Karmikas", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// -------------------- Get current user --------------------
const getUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const safeUser = currentUser.toObject();
    delete safeUser.password;
    res.status(200).json({ status: "success", user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};

// -------------------- Update --------------------
const update = async (req, res) => {
  try {
    const { email, otpCode, type, userType, ...updates } = req.body;

    if (!otpCode) {
      return res.status(400).json({ status: "fail", message: "OTP code is required" });
    }

    // ✅ Normalize user type (accepts both `type` and `userType`)
    const finalType = type || (userType === "users" ? "user" : "karmika");

    // Verify OTP
    await verifyAndConsumeOtp({
      email: email.toLowerCase(),
      userType: finalType === "user" ? "users" : "karmikas",
      purpose: "profile_update",
      code: otpCode,
    });

    const Model = finalType === "user" ? userSignupModel : karmikaSignupModel;
    const updated = await Model.findOneAndUpdate({ email: email.toLowerCase() }, updates, { new: true });

    if (!updated) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }

    res.json({ status: "success", message: "Profile updated", user: updated });
  } catch (err) {
    console.error("Update error:", err);
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// -------------------- Photo upload --------------------
const photo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: "fail", message: "No file provided" });

    const id = req.user._id;
    const user = await userSignupModel.findById(id);
    const karmika = await karmikaSignupModel.findById(id);

    const uploaded = await uploadBufferToCloudinary(req.file.buffer, "karmika/profiles");
    let updatedUser;
    if (user) {
      updatedUser = await userSignupModel.findByIdAndUpdate(id, { image: uploaded.secure_url }, { new: true, runValidators: true });
    } else {
      updatedUser = await karmikaSignupModel.findByIdAndUpdate(id, { profileImage: uploaded.secure_url }, { new: true, runValidators: true });
    }

    const safeUser = updatedUser.toObject();
    delete safeUser.password;
    res.status(200).json({ status: "success", user: safeUser });
  } catch (err) {
    console.error("photo upload error", err);
    res.status(500).json({ status: "error", message: "Unable to upload photo" });
  }
};

// -------------------- Reset password --------------------
const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, userType, otpCode, newPassword } = req.body;
    if (!email || !userType || !otpCode || !newPassword) {
      return res.status(400).json({ status: "fail", message: "email, userType, otpCode, newPassword required" });
    }
    if (!["users", "karmikas"].includes(userType)) {
      return res.status(400).json({ status: "fail", message: "Invalid userType" });
    }

    await verifyAndConsumeOtp({ email, userType, purpose: "password_reset", code: otpCode });

    const hash = bcryptJs.hashSync(newPassword);
    let updated;
    if (userType === "users") {
      updated = await userSignupModel.findOneAndUpdate({ email: email.toLowerCase() }, { password: hash }, { new: true });
    } else {
      updated = await karmikaSignupModel.findOneAndUpdate({ email: email.toLowerCase() }, { password: hash }, { new: true });
    }
    if (!updated) return res.status(404).json({ status: "fail", message: "Account not found" });

    return res.status(200).json({ status: "success", message: "Password reset successful" });
  } catch (err) {
    console.error("resetPasswordWithOtp error:", err);
    return res.status(err.status || 500).json({ status: "error", message: err.message || "Internal server error" });
  }
};

module.exports = {
  // OTP
  requestSignupOtp,
  requestProfileUpdateOtp,
  requestPasswordResetOtp,

  // Auth / Users
  userSignupModelController,
  karmikaSignupModelController,
  LoginController,
  getKarmikas,
  getUser,
  protect: require("../Middleware/authMiddleware").protect,
  update,
  photo,
  resetPasswordWithOtp,
};
