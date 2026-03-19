require('dotenv').config();
const { sendEmail, templates } = require('./services/emailService');

async function test() {
    console.log('Testing SMTP connection...');
    try {
        await sendEmail('helloworld1755@gmail.com', 'Test OTP', templates.welcomeOTP('HelloWorld', '123456'));
        console.log('✅ Email sent successfully!');
    } catch (err) {
        console.error('❌ Failed to send email:', err);
        process.exit(1);
    }
}

test();
