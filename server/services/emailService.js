// Email service: handles sending emails (SMTP or dev log)
const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, text, html }) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({ from: process.env.FROM_EMAIL || process.env.SMTP_USER, to, subject, text, html });
  } else {
    console.log('--- email (dev) ---');
    console.log('to:', to);
    console.log('subject:', subject);
    console.log('text:', text);
    if (html) console.log('html:', html);
    console.log('--- end email ---');
  }
}

module.exports = { sendEmail };
