require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: true,
      debug: true
    });

    const info = await transporter.sendMail({
      from: `"ROOMS" <${process.env.SMTP_USER}>`,
      to: 'adityagptaa17@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email from ROOMS backend.',
    });
    console.log('Success:', info.messageId);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
