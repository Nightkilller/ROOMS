const mongoose = require('mongoose');

const loginSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ipAddress: { type: String, default: 'Unknown' },
    userAgent: { type: String, default: '' },
    device: { type: String, default: 'Unknown' },
    browser: { type: String, default: 'Unknown' },
    city: { type: String, default: 'Unknown' },
    country: { type: String, default: 'Unknown' },
    loginAt: { type: Date, default: Date.now },
    successful: { type: Boolean, default: true },
    isCurrentSession: { type: Boolean, default: false },
});

module.exports = mongoose.model('LoginSession', loginSessionSchema);
