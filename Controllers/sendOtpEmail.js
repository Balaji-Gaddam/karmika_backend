const nodemailer = require("nodemailer");

const sendOtpEmail = async (to, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,   // gmail id
        pass: process.env.EMAIL_PASS,   // app password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${to}`);
  } catch (err) {
    console.error("Email sending error:", err);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = sendOtpEmail;