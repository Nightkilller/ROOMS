const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');
const passport = require('passport');
const ac = require('../controllers/authController');

const router = express.Router();

// Firebase Email Link Authentication
router.post('/firebase-login', authLimiter, [
    body('idToken').notEmpty().withMessage('Firebase ID Token is required.'),
], validate, ac.firebaseLogin);

// Guest Login
router.post('/guest', authLimiter, [
    body('name').trim().notEmpty().withMessage('Name is required.'),
], validate, ac.guestLogin);

// Refresh Token
router.post('/refresh', ac.refresh);

// Logout
router.post('/logout', ac.logout);

// Set Refresh Cookie (cross-domain OAuth support)
router.post('/set-refresh-cookie', ac.setRefreshCookie);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`, session: false }), ac.googleCallback);

module.exports = router;
