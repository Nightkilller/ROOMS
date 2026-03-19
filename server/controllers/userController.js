const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LoginSession = require('../models/LoginSession');
const RefreshToken = require('../models/RefreshToken');
const { generateOTP, hashOTP, verifyOTP } = require('../utils/otp');
const { sendEmail, templates } = require('../services/emailService');

// ── GET PROFILE ───────────────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash -otpHash -resetSessionToken');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── GET LOGIN HISTORY ─────────────────────────────────────────
exports.getLoginHistory = async (req, res) => {
    try {
        const sessions = await LoginSession.find({ userId: req.user.id })
            .sort({ loginAt: -1 })
            .limit(10);
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── CHANGE PASSWORD ───────────────────────────────────────────
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user.passwordHash) {
            return res.status(400).json({ message: 'Account uses Google login. Set a password via forgot password.' });
        }

        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) return res.status(400).json({ message: 'Current password is incorrect.' });

        user.passwordHash = await bcrypt.hash(newPassword, 12);
        await user.save();

        await sendEmail(user.email, 'Password Changed — ROOMS', templates.passwordChanged(user.fullName));
        res.json({ message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── LOGOUT ALL DEVICES ───────────────────────────────────────
exports.logoutAllDevices = async (req, res) => {
    try {
        await RefreshToken.deleteMany({ userId: req.user.id });
        res.json({ message: 'Logged out of all devices.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── DELETE ACCOUNT ────────────────────────────────────────────
exports.requestDeleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const otp = generateOTP();
        user.otpHash = await hashOTP(otp);
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otpAttempts = 0;
        await user.save();

        await sendEmail(user.email, 'Account Deletion OTP — ROOMS', templates.twoFactorOTP(user.fullName, otp));
        res.json({ message: 'OTP sent for account deletion confirmation.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.confirmDeleteAccount = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user.id);

        if (!user.otpHash || user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP expired.' });
        }

        const valid = await verifyOTP(otp, user.otpHash);
        if (!valid) return res.status(400).json({ message: 'Invalid OTP.' });

        const email = user.email;
        const name = user.fullName;

        await RefreshToken.deleteMany({ userId: user._id });
        await LoginSession.deleteMany({ userId: user._id });
        await User.deleteOne({ _id: user._id });

        await sendEmail(email, 'Account Deleted — ROOMS', templates.accountDeleted(name));

        res.clearCookie('refreshToken');
        res.json({ message: 'Account deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};
