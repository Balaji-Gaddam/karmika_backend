// utils/mailer.js
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY)

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("EMAIL_USER / EMAIL_PASS not set");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, text, html }) {
  try {
    await resend.emails.send({
      from: `"Karmika" <${process.env.EMAIL_USER}>`,
      // 👆 default sender, works without domain verification
      to,
      subject,
      text,
      html,
    });
    console.log("✅ Email sent to:", to);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw err;
  }
}

module.exports = sendEmail;

// const sendEmail = async ({ to, subject, html, text }) => {
//   try {
//     await transporter.sendMail({
//       from: `"Karmika" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       text,
//       html,
//     });
//     return true;
//   } catch (err) {
//     console.error("Email send error:", err);
//     throw err;
//   }
// };

// module.exports = { sendEmail };