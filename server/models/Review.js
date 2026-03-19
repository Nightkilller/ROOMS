const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    category: { type: String, enum: ['general', 'ui', 'performance', 'features', 'bug'], default: 'general' },
    message: { type: String, required: true, maxlength: 1000 },
    isRead: { type: Boolean, default: false },   // admin read status
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
