const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.SMTP_USER) {
      console.log(`[Email désactivé] À: ${to} | Sujet: ${subject}`);
      return;
    }
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Erreur envoi email:', error.message);
  }
};
