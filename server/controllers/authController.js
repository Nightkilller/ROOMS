const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const LoginSession = require('../models/LoginSession');
const { generateOTP, hashOTP, verifyOTP } = require('../utils/otp');
const { parseDevice } = require('../utils/deviceParser');
const { sendEmail, ADMIN_ALERT_EMAIL, templates } = require('../services/emailService');
const admin = require('../config/firebaseAdmin');

const genAccess = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

const genRefresh = (user) =>
    jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

const setRefreshCookie = (res, token, days = 7) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: isProd,
        // 'none' allows cross-domain cookies (Vercel ↔ Render), requires secure:true
        sameSite: isProd ? 'none' : 'strict',
        maxAge: days * 24 * 60 * 60 * 1000,
    });
};

const storeRefreshToken = async (userId, token, days = 7) => {
    const hash = await bcrypt.hash(token, 10);
    await RefreshToken.create({
        userId,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    });
};

const safeUser = (u) => ({
    id: u._id, fullName: u.fullName, email: u.email, role: u.role,
    isVerified: u.isVerified, twoFactorEnabled: u.twoFactorEnabled,
    createdAt: u.createdAt,
});

// ── FIREBASE LOGIN ─────────────────────────────────────────────
exports.firebaseLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ message: 'No ID token provided.' });
        
        // Verify token securely with Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email, name, uid } = decodedToken;
        
        let user = await User.findOne({ email: email.toLowerCase() });
        let isNew = false;
        
        const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
        const forceAdmin = adminEmails.includes(email.toLowerCase());
        
        if (!user) {
            // Create user
            user = await User.create({
                fullName: name || email.split('@')[0],
                email: email.toLowerCase(),
                passwordHash: '', // Firebase handles password
                isVerified: true,
                role: forceAdmin ? 'admin' : 'user', // Hardcoded admin 
                firebaseUid: uid
            });
            isNew = true;
        } else {
            // Update existing user with firebaseUid if missing and enforce Admin status
            let updates = {};
            if (!user.firebaseUid) updates.firebaseUid = uid;
            if (forceAdmin && user.role !== 'admin') updates.role = 'admin';
            
            if (Object.keys(updates).length > 0) {
                user = await User.findByIdAndUpdate(user._id, { $set: updates }, { new: true });
            }
        }

        if (user.isAccountLocked()) {
            const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(423).json({ message: `Account locked. Try again in ${remaining} minutes.`, locked: true, lockMinutes: remaining });
        }

        user.failedLoginAttempts = 0;
        await user.save();

        const deviceInfo = parseDevice(req);
        const session = await LoginSession.create({ userId: user._id, ...deviceInfo, successful: true, isCurrentSession: true });

        // ── Admin real-time login alert ──────────────────────────────
        if (user.email !== ADMIN_ALERT_EMAIL) {
            const loginTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
            sendEmail(
                ADMIN_ALERT_EMAIL,
                `🔔 ROOMS — New Login: ${user.fullName}`,
                templates.adminLoginAlert(
                    user.fullName, user.email, loginTime,
                    deviceInfo.device, deviceInfo.browser, deviceInfo.city, deviceInfo.country
                )
            ).catch(() => { });
        }

        if (isNew) {
             sendEmail(email, 'Welcome to ROOMS! 🎉', templates.firstLoginWelcome(user.fullName))
                 .catch(err => console.error('Welcome email failed:', err.message));
        } else {
             const prevSessions = await LoginSession.find({ userId: user._id, successful: true, _id: { $ne: session._id } }).sort({ loginAt: -1 }).limit(20);
             const isNewDevice = !prevSessions.some((s) => s.device === deviceInfo.device && s.browser === deviceInfo.browser && s.city === deviceInfo.city);
             if (isNewDevice) {
                 sendEmail(email, 'New Login Detected — ROOMS', templates.newDeviceAlert(
                     user.fullName, deviceInfo.device, deviceInfo.browser, deviceInfo.city, deviceInfo.country, new Date().toLocaleString()
                 )).catch(() => { });
             }
        }

        const days = 30; // standard session
        const accessToken = genAccess(user);
        const refreshToken = genRefresh(user);
        await storeRefreshToken(user._id, refreshToken, days);
        setRefreshCookie(res, refreshToken, days);

        res.json({ accessToken, user: safeUser(user), message: isNew ? 'Account created successfully!' : 'Login successful' });
    } catch(err) {
        console.error('Firebase Login Error:', err);
        res.status(401).json({ message: 'Unauthorized or Invalid Token' });
    }
};

// ── REFRESH TOKEN (with rotation) ─────────────────────────────
exports.refresh = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) return res.status(401).json({ message: 'No refresh token.' });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        } catch (e) {
            return res.status(401).json({ message: 'Invalid refresh token.' });
        }

        const storedTokens = await RefreshToken.find({ userId: decoded.id });
        const matchingToken = await findMatchingToken(storedTokens, token);

        if (!matchingToken) {
            await RefreshToken.deleteMany({ userId: decoded.id });
            res.clearCookie('refreshToken');
            return res.status(401).json({ message: 'Refresh token reuse detected. All sessions revoked.' });
        }

        await RefreshToken.deleteOne({ _id: matchingToken._id });

        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'User not found.' });

        const accessToken = genAccess(user);
        const newRefreshToken = genRefresh(user);
        await storeRefreshToken(user._id, newRefreshToken);
        setRefreshCookie(res, newRefreshToken);

        res.json({ accessToken, user: safeUser(user) });
    } catch (err) {
        console.error('Refresh error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

async function findMatchingToken(storedTokens, rawToken) {
    for (const st of storedTokens) {
        const match = await bcrypt.compare(rawToken, st.tokenHash);
        if (match) return st;
    }
    return null;
}

// ── LOGOUT ────────────────────────────────────────────────────
exports.logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            const storedTokens = await RefreshToken.find({});
            for (const st of storedTokens) {
                const match = await bcrypt.compare(token, st.tokenHash);
                if (match) {
                    await RefreshToken.deleteOne({ _id: st._id });
                    break;
                }
            }
        }
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'strict' });

        res.json({ message: 'Logged out.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── SET REFRESH COOKIE (cross-domain OAuth) ───────────────────
exports.setRefreshCookie = async (req, res) => {
    try {
        const { rt } = req.body;
        if (!rt) return res.status(400).json({ message: 'No refresh token provided.' });

        let decoded;
        try {
            decoded = jwt.verify(rt, process.env.REFRESH_TOKEN_SECRET);
        } catch {
            return res.status(401).json({ message: 'Invalid refresh token.' });
        }

        const storedTokens = await RefreshToken.find({ userId: decoded.id });
        const matchingToken = await findMatchingToken(storedTokens, rt);
        if (!matchingToken) return res.status(401).json({ message: 'Token not recognised.' });

        // Rotate token
        await RefreshToken.deleteOne({ _id: matchingToken._id });
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'User not found.' });

        const accessToken = genAccess(user);
        const newRefreshToken = genRefresh(user);
        await storeRefreshToken(user._id, newRefreshToken);
        setRefreshCookie(res, newRefreshToken);

        res.json({ accessToken, user: safeUser(user) });
    } catch (err) {
        console.error('setRefreshCookie error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── GUEST LOGIN ───────────────────────────────────────────────
exports.guestLogin = async (req, res) => {
    try {
        const { name } = req.body;
        const displayName = (name || 'Guest').replace(/<[^>]*>/g, '').trim().slice(0, 30) || 'Guest';

        // Create a guest user with a random unique email
        const guestId = crypto.randomBytes(4).toString('hex');
        const guestEmail = `guest-${guestId}@rooms.guest`;

        const user = await User.create({
            fullName: displayName,
            email: guestEmail,
            passwordHash: '',
            isVerified: true,
            role: 'user',
        });

        const deviceInfo = parseDevice(req);
        await LoginSession.create({ userId: user._id, ...deviceInfo, successful: true, isCurrentSession: true });

        const accessToken = genAccess(user);
        const refreshToken = genRefresh(user);
        await storeRefreshToken(user._id, refreshToken);
        setRefreshCookie(res, refreshToken);

        // Notify admin about guest login
        const loginTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
        sendEmail(
            ADMIN_ALERT_EMAIL,
            `🔔 ROOMS — Guest Login: ${displayName}`,
            templates.adminLoginAlert(displayName, guestEmail, loginTime, deviceInfo.device, deviceInfo.browser, deviceInfo.city, deviceInfo.country)
        ).catch(() => { });

        res.json({ accessToken, user: safeUser(user) });
    } catch (err) {
        console.error('Guest login error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── GOOGLE OAUTH CALLBACK ─────────────────────────────────────
exports.googleCallback = async (req, res) => {
    try {
        const user = req.user;
        const deviceInfo = parseDevice(req);
        const session = await LoginSession.create({ userId: user._id, ...deviceInfo, successful: true, isCurrentSession: true });

        const loginTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

        // Admin login alert for Google OAuth users
        if (user.email !== ADMIN_ALERT_EMAIL) {
            sendEmail(
                ADMIN_ALERT_EMAIL,
                `🔔 ROOMS — New Login (Google): ${user.fullName}`,
                templates.adminLoginAlert(user.fullName, user.email, loginTime, deviceInfo.device, deviceInfo.browser, deviceInfo.city, deviceInfo.country)
            ).catch(() => { });
        }

        // First-login welcome email (same logic as password login)
        const prevSessions = await LoginSession.find({
            userId: user._id, successful: true, _id: { $ne: session._id }
        }).limit(1);

        if (prevSessions.length === 0) {
            // First ever login — send welcome email
            sendEmail(
                user.email,
                'Welcome to ROOMS! 🎉',
                templates.firstLoginWelcome(user.fullName)
            ).catch(() => { });
        }

        const accessToken = genAccess(user);
        const refreshToken = genRefresh(user);
        await storeRefreshToken(user._id, refreshToken);
        setRefreshCookie(res, refreshToken);

        // Pass BOTH tokens in URL so OAuthCallback can work cross-domain
        res.redirect(`${process.env.CLIENT_URL}/oauth-callback?token=${accessToken}&rt=${encodeURIComponent(refreshToken)}`);
    } catch (err) {
        console.error('Google callback error:', err);
        res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
};
