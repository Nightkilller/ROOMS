const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const rc = require('../controllers/reviewController');

// User routes
router.post('/', auth, [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
    body('message').trim().notEmpty().isLength({ max: 1000 }).withMessage('Message required (max 1000 chars)'),
    body('category').optional().isIn(['general', 'ui', 'performance', 'features', 'bug']),
], validate, rc.submitReview);

router.get('/mine', auth, rc.getMyReviews);

// Admin routes
router.get('/', auth, adminAuth, rc.getAllReviews);
router.patch('/:id/read', auth, adminAuth, rc.markRead);

module.exports = router;
