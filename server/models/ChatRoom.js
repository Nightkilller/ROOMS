const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['direct', 'group'],
        required: true,
    },
    name: {
        type: String,
        default: '',
        maxlength: 100,
        trim: true,
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    lastMessage: {
        text: { type: String, default: '' },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        messageType: { type: String, default: 'text' },
        timestamp: { type: Date },
    },
}, { timestamps: true });

// Fast lookup: find all chats for a user, sorted by recent activity
chatRoomSchema.index({ participants: 1, updatedAt: -1 });

// Prevent duplicate DMs between the same two users
chatRoomSchema.index(
    { type: 1, participants: 1 },
    { unique: false } // handled in controller logic
);

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
