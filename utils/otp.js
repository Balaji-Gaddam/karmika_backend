const crypto = require("crypto");

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

const otpHtml = (code, minutes) => `
  <div style="font-family:Arial,Helvetica,sans-serif">
    <h2>Karmika Dalam Verification Code</h2>
    <p>Your one-time code is:</p>
    <div style="font-size:38px;font-weight:bold;letter-spacing:3px">${code}</div>
    <p>This code expires in <strong>${minutes} minutes</strong>.</p>
    <p>If you didn’t request this, you can ignore this email.</p>
  </div>
`;

module.exports = { generateOtp, otpHtml };