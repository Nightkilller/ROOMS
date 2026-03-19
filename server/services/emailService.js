const nodemailer = require('nodemailer');
// Uses Nodemailer with SMTP — configured via environment variables

const baseStyle = `
  body { margin:0; padding:0; background:#0f0f23; font-family:'Segoe UI',Arial,sans-serif; }
  .wrapper { max-width:560px; margin:0 auto; background:#1a1a2e; border-radius:12px; overflow:hidden; border:1px solid rgba(139,92,246,0.2); }
  .header { background:linear-gradient(135deg,#7c3aed,#8b5cf6); padding:28px 32px; text-align:center; }
  .header h1 { color:#fff; margin:0; font-size:26px; letter-spacing:2px; }
  .header .logo { font-size:32px; display:block; margin-bottom:6px; }
  .body { padding:32px; color:#d1d5db; line-height:1.7; font-size:15px; }
  .body h2 { color:#e0e0ff; margin-top:0; font-size:20px; }
  .otp-box { text-align:center; margin:24px 0; }
  .otp-code { display:inline-block; background:#0f0f23; color:#a78bfa; font-size:36px; font-weight:700; letter-spacing:12px; padding:16px 32px; border-radius:10px; border:2px solid rgba(139,92,246,0.3); font-family:monospace; }
  .btn-wrap { text-align:center; margin:24px 0; }
  .btn { display:inline-block; background:linear-gradient(135deg,#7c3aed,#8b5cf6); color:#fff; padding:14px 36px; border-radius:8px; text-decoration:none; font-weight:600; font-size:15px; }
  .info-box { background:#0f0f23; border-radius:8px; padding:16px; margin:16px 0; border-left:3px solid #8b5cf6; }
  .info-box p { margin:4px 0; color:#9ca3af; font-size:13px; }
  .info-box strong { color:#e0e0ff; }
  .footer { padding:20px 32px; background:#0f0f23; text-align:center; color:#6b7280; font-size:12px; border-top:1px solid rgba(139,92,246,0.15); }
  .footer a { color:#8b5cf6; text-decoration:none; }
  .warning { margin-top:16px; padding:12px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:8px; color:#fca5a5; font-size:13px; }
`;

const wrap = (content) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>${baseStyle}</style></head>
<body><div class="wrapper">${content}</div></body></html>
`;

const header = `<div class="header"><span class="logo">◈</span><h1>ROOMS</h1></div>`;
const footer = `<div class="footer"><p>© ${new Date().getFullYear()} ROOMS — Private. Secure. Enterprise.</p><p>This is an automated message. Please do not reply.</p></div>`;
const warningBlock = `<div class="warning">⚠️ If you did not initiate this action, please secure your account immediately or contact support.</div>`;

// ─── Template 1: Welcome + Email Verification OTP ─────────────
const welcomeOTP = (name, otp) => wrap(`
  ${header}
  <div class="body">
    <h2>Welcome to ROOMS, ${name}! 🎉</h2>
    <p>Thank you for signing up. To activate your account, please enter the verification code below:</p>
    <div class="otp-box"><span class="otp-code">${otp}</span></div>
    <p style="text-align:center;color:#9ca3af;font-size:13px;">This code expires in <strong style="color:#e0e0ff;">5 minutes</strong></p>
    <p>If you didn't create a ROOMS account, you can safely ignore this email.</p>
  </div>
  ${footer}
`);

// ─── Template 2: Forgot Password OTP ──────────────────────────
const forgotPasswordOTP = (name, otp) => wrap(`
  ${header}
  <div class="body">
    <h2>Password Reset Request</h2>
    <p>Hi ${name}, we received a request to reset your password. Use the code below to proceed:</p>
    <div class="otp-box"><span class="otp-code">${otp}</span></div>
    <p style="text-align:center;color:#9ca3af;font-size:13px;">This code expires in <strong style="color:#e0e0ff;">5 minutes</strong></p>
    ${warningBlock}
  </div>
  ${footer}
`);

// ─── Template 3: Password Changed Confirmation ────────────────
const passwordChanged = (name) => wrap(`
  ${header}
  <div class="body">
    <h2>Password Successfully Changed ✅</h2>
    <p>Hi ${name}, your password has been successfully updated.</p>
    <p>All active sessions have been logged out for your security. You can log in with your new password.</p>
    ${warningBlock}
  </div>
  ${footer}
`);

// ─── Template 4: New Device Login Alert ───────────────────────
const newDeviceAlert = (name, device, browser, city, country, time) => wrap(`
  ${header}
  <div class="body">
    <h2>New Login Detected 🔔</h2>
    <p>Hi ${name}, we noticed a login to your account from a new device or location:</p>
    <div class="info-box">
      <p><strong>Device:</strong> ${device}</p>
      <p><strong>Browser:</strong> ${browser}</p>
      <p><strong>Location:</strong> ${city}, ${country}</p>
      <p><strong>Time:</strong> ${time}</p>
    </div>
    ${warningBlock}
  </div>
  ${footer}
`);

// ─── Template 5: Account Locked Notification ──────────────────
const accountLocked = (name, unlockTime) => wrap(`
  ${header}
  <div class="body">
    <h2>Account Temporarily Locked 🔒</h2>
    <p>Hi ${name}, your account has been temporarily locked due to multiple failed login attempts.</p>
    <p>Your account will automatically unlock at: <strong style="color:#e0e0ff;">${unlockTime}</strong></p>
    <p>If this wasn't you, someone may be trying to access your account. We recommend changing your password after the lockout period.</p>
    ${warningBlock}
  </div>
  ${footer}
`);

// ─── Template 6: Account Deletion Confirmation ────────────────
const accountDeleted = (name) => wrap(`
  ${header}
  <div class="body">
    <h2>Account Deleted</h2>
    <p>Hi ${name}, your ROOMS account has been permanently deleted as requested.</p>
    <p>All your data, sessions, and associated information have been removed from our systems.</p>
    <p>We're sorry to see you go. If you ever want to return, you're welcome to create a new account.</p>
  </div>
  ${footer}
`);

// ─── Template: 2FA OTP ────────────────────────────────────────
const twoFactorOTP = (name, otp) => wrap(`
  ${header}
  <div class="body">
    <h2>Two-Factor Authentication</h2>
    <p>Hi ${name}, here is your 2FA verification code:</p>
    <div class="otp-box"><span class="otp-code">${otp}</span></div>
    <p style="text-align:center;color:#9ca3af;font-size:13px;">This code expires in <strong style="color:#e0e0ff;">5 minutes</strong></p>
    ${warningBlock}
  </div>
  ${footer}
`);

// ─── Template: First Login Welcome ────────────────────────────
const firstLoginWelcome = (name) => wrap(`
  ${header}
  <div class="body">
    <h2>Welcome to ROOMS, ${name}! 🎉</h2>
    <p>Happy to have you here! Feel free to express yourself, create rooms, chat freely and make connections.</p>
    <div class="info-box">
      <p>🚀 <strong>Create private rooms</strong> — encrypted, ephemeral chat spaces</p>
      <p>🔗 <strong>Share a link</strong> — invite anyone with one click</p>
      <p>📎 <strong>Share files & media</strong> — images, PDFs, videos, voice messages</p>
      <p>📹 <strong>Video calls</strong> — connect face-to-face instantly</p>
      <p>⭐ <strong>Leave a review</strong> — your feedback shapes ROOMS!</p>
    </div>
    <p>Your review <strong>must be appreciated</strong> — head to the Review tab and let us know what you'd like to see improved. We read every single one!</p>
    <p style="margin-top:24px;">Happy chatting! ✨</p>
    <p style="color:#9ca3af;font-size:13px;margin-top:16px;">— Made by <strong style="color:#a78bfa;">Aditya</strong> with 🧠 and a lot of ☕️</p>
  </div>
  ${footer}
`);

// ─── Template: Admin — New User Login Alert ────────────────────
const adminLoginAlert = (userName, userEmail, loginTime, device, browser, city, country) => wrap(`
  ${header}
  <div class="body">
    <h2 style="color:#F0A026">🔔 New Candidate Joined ROOMS!</h2>
    <p>Someone just logged into <strong style="color:#e0e0ff">ROOMS</strong>. Here are the real-time details:</p>
    <div class="info-box" style="border-left-color:#F0A026">
      <p><strong>👤 Name:</strong> ${userName}</p>
      <p><strong>📧 Email:</strong> ${userEmail}</p>
      <p><strong>🕐 Login Time:</strong> ${loginTime}</p>
      <p><strong>💻 Device:</strong> ${device || 'Unknown'}</p>
      <p><strong>🌐 Browser:</strong> ${browser || 'Unknown'}</p>
      <p><strong>📍 Location:</strong> ${city || 'Unknown'}, ${country || 'Unknown'}</p>
    </div>
    <p style="color:#9ca3af;font-size:13px;margin-top:12px;">You are receiving this as the ROOMS administrator.</p>
  </div>
  ${footer}
`);

// ─── Template: Admin — New Review Alert ───────────────────────
const adminReviewAlert = (userName, userEmail, rating, category, message, time) => wrap(`
  ${header}
  <div class="body">
    <h2 style="color:#a78bfa">⭐ New Review Submitted!</h2>
    <p>A user just submitted a review on <strong style="color:#e0e0ff">ROOMS</strong>.</p>
    <div class="info-box" style="border-left-color:#a78bfa">
      <p><strong>👤 Name:</strong> ${userName}</p>
      <p><strong>📧 Email:</strong> ${userEmail}</p>
      <p><strong>⭐ Rating:</strong> ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)</p>
      <p><strong>🏷️ Category:</strong> ${category}</p>
      <p><strong>🕐 Time:</strong> ${time}</p>
    </div>
    <div class="info-box" style="margin-top:12px">
      <p><strong>💬 Message:</strong></p>
      <p style="color:#e0e0ff;font-style:italic">"${message}"</p>
    </div>
    <p style="color:#9ca3af;font-size:13px;margin-top:12px;">View all reviews in the admin panel.</p>
  </div>
  ${footer}
`);

// ─── Admin alert destination ───────────────────────────────────
const ADMIN_ALERT_EMAIL = 'adityagptaa17@gmail.com';

// Nodemailer transporter initialization
let smtpTransporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

// Main sendEmail: prioritizes Resend API, falls back to Nodemailer (SMTP)
const sendEmail = async (to, subject, html) => {
  try {
    // 1. Try Resend API first (if configured)
    if (process.env.RESEND_API_KEY) {
      const fromEmail = process.env.SMTP_FROM || 'ROOMS <noreply@rooms.app>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        })
      });
      if (res.ok) {
        console.log(`📧 [RESEND] Email successfully sent to ${to}: ${subject}`);
        return;
      }
      const errData = await res.text();
      console.warn(`⚠️ [RESEND] Failed, falling back to SMTP... Error: ${errData}`);
    }

    // 2. Fallback to Nodemailer
    if (!smtpTransporter) {
      throw new Error('Neither RESEND_API_KEY nor SMTP is configured properly.');
    }

    // Gmail requires the "From" address to match the authenticated user, or it drops it.
    // If SMTP_FROM exists, we format it as "Name <SMTP_USER>" to avoid spoofing DMARC/SPF blocks.
    let fromField = process.env.SMTP_FROM || '"ROOMS" <noreply@rooms.app>';
    if (process.env.SMTP_USER && process.env.SMTP_HOST?.includes('gmail')) {
      fromField = `"ROOMS" <${process.env.SMTP_USER}>`;
    }

    const info = await smtpTransporter.sendMail({
      from: fromField,
      to,
      subject,
      html,
    });
    
    console.log(`📧 [SMTP] Email successfully sent to ${to}: ${subject} (ID: ${info.messageId})`);
  } catch (error) {
    console.error(`❌ Email error to ${to}:`, error.message);
    throw error;
  }
};

module.exports = {
  sendEmail,
  ADMIN_ALERT_EMAIL,
  templates: {
    welcomeOTP,
    forgotPasswordOTP,
    passwordChanged,
    newDeviceAlert,
    accountLocked,
    accountDeleted,
    twoFactorOTP,
    firstLoginWelcome,
    adminLoginAlert,
    adminReviewAlert,
  },
};
