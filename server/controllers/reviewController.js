const Review = require('../models/Review');
const { sendEmail, ADMIN_ALERT_EMAIL, templates } = require('../services/emailService');

// ── POST /api/reviews — Submit a review ──────────────────────
exports.submitReview = async (req, res) => {
    try {
        const { rating, category, message } = req.body;

        const review = await Review.create({
            userId: req.user.id,
            rating,
            category: category || 'general',
            message,
        });

        const populated = await review.populate('userId', 'fullName email');

        // Fire admin email (fire-and-forget)
        sendEmail(
            ADMIN_ALERT_EMAIL,
            `⭐ ROOMS — New Review from ${populated.userId.fullName}`,
            templates.adminReviewAlert(
                populated.userId.fullName,
                populated.userId.email,
                rating,
                category || 'general',
                message,
                new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
            )
        ).catch(() => { });

        res.status(201).json({ message: 'Review submitted! Thank you for your feedback.', review });
    } catch (err) {
        console.error('Submit review error:', err);
        res.status(500).json({ message: 'Failed to submit review.' });
    }
};

// ── GET /api/reviews/mine — User's own reviews ───────────────
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch reviews.' });
    }
};

// ── GET /api/reviews — Admin: all reviews ────────────────────
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch reviews.' });
    }
};

// ── PATCH /api/reviews/:id/read — Admin: mark as read ────────
exports.markRead = async (req, res) => {
    try {
        await Review.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ message: 'Marked as read.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update.' });
    }
};
