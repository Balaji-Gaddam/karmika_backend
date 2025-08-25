const mongoose = require("mongoose");

const OtpTokenSchema = new mongoose.Schema({
  email: { type: String, index: true, required: true, lowercase: true, trim: true },
  userType: { type: String, enum: ["users", "karmikas"], required: true },
  purpose: { type: String, enum: ["signup", "profile_update", "password_reset"], required: true },
  code: { type: String, required: true }, // store as plain 6-digit; could hash if desired
  attempts: { type: Number, default: 0 },
  consumed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model("OtpToken", OtpTokenSchema);