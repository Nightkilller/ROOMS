/**
 * dev-start.js — Zero-config test environment
 * Starts an in-memory MongoDB server, then boots the Express app.
 * No external database, no SMTP, no Google OAuth needed.
 * OTPs are logged to the console so you can test the full auth flow.
 */

const { MongoMemoryServer } = require('mongodb-memory-server');

async function start() {
    console.log('\n🧪 Starting ROOMS Test Environment...\n');
    console.log('⏳ Downloading & booting in-memory MongoDB (first run takes ~1 min)...');

    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Set environment variables for the app
    process.env.MONGO_URI = uri;
    process.env.PORT = process.env.PORT || '5000';
    process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-key-dev-2024';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-dev-2024';
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.SMTP_HOST = '';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = '';
    process.env.SMTP_PASS = '';
    process.env.SMTP_FROM = 'ROOMS <test@rooms.app>';
    process.env.GOOGLE_CLIENT_ID = 'not-configured';
    process.env.GOOGLE_CLIENT_SECRET = 'not-configured';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5000/api/auth/google/callback';

    console.log(`✅ In-memory MongoDB running at: ${uri}\n`);

    // Patch the email service to log OTPs to console instead of sending
    const emailService = require('./services/emailService');
    const originalSend = emailService.sendEmail;
    emailService.sendEmail = async (to, subject, html) => {
        // Extract OTP from HTML if present
        const otpMatch = html.match(/class="otp-code">(\d{6})</);
        const otp = otpMatch ? otpMatch[1] : null;

        console.log('\n' + '═'.repeat(50));
        console.log('📧 EMAIL (not actually sent)');
        console.log('═'.repeat(50));
        console.log(`  To:      ${to}`);
        console.log(`  Subject: ${subject}`);
        if (otp) {
            console.log(`  ┌─────────────────────┐`);
            console.log(`  │   OTP CODE: ${otp}   │`);
            console.log(`  └─────────────────────┘`);
        }
        console.log('═'.repeat(50) + '\n');
    };

    // Seed admin user
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    await mongoose.connect(uri);
    const User = require('./models/User');
    const existingAdmin = await User.findOne({ email: 'admin@rooms.app' });
    if (!existingAdmin) {
        await User.create({
            fullName: 'System Admin',
            email: 'admin@rooms.app',
            passwordHash: await bcrypt.hash('Admin@1234', 12),
            isVerified: true,
            role: 'admin',
        });
        console.log('👤 Admin user seeded:');
        console.log('   Email:    admin@rooms.app');
        console.log('   Password: Admin@1234\n');
    }
    await mongoose.disconnect();

    // Now start the real server
    require('./server');
}

start().catch((err) => {
    console.error('❌ Failed to start test environment:', err);
    process.exit(1);
});
