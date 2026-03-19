const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const uc = require('../controllers/userController');

const router = express.Router();

router.get('/profile', auth, uc.getProfile);
router.get('/sessions', auth, uc.getLoginHistory);

router.post('/change-password', auth, [
    body('currentPassword').notEmpty().withMessage('Current password required.'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Min 8 characters.')
        .matches(/[A-Z]/).withMessage('Uppercase required.')
        .matches(/[0-9]/).withMessage('Number required.')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Special character required.'),
], validate, uc.changePassword);

router.post('/logout-all', auth, uc.logoutAllDevices);
router.post('/request-delete', auth, uc.requestDeleteAccount);
router.post('/confirm-delete', auth, [
    body('otp').isLength({ min: 6, max: 6 }),
], validate, uc.confirmDeleteAccount);

module.exports = router;
