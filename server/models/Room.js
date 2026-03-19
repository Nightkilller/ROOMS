const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'Untitled Room', maxlength: 60 },
    hostUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        nickname: { type: String, default: '' },
        joinedAt: { type: Date, default: Date.now },
    }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Auto-delete expired rooms
roomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

roomSchema.methods.isExpired = function () {
    return new Date() >= this.expiresAt;
};

module.exports = mongoose.model('Room', roomSchema);
