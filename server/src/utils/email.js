import nodemailer from 'nodemailer';

export async function sendAppointmentEmail(to, subject, text) {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log(`[Email preview] To: ${to} | ${subject}\n${text}`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  await transporter.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, text });
}
