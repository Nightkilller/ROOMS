const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom',
        required: true,
        index: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'pdf', 'file', 'voice', 'audio', 'video'],
        default: 'text',
    },
    text: {
        type: String,
        default: '',
        maxlength: 5000,
    },
    fileUrl: {
        type: String,
        default: '',
    },
    fileName: {
        type: String,
        default: '',
    },
    fileSize: {
        type: Number,
        default: 0,
    },
    // Reply-to: reference to the original message
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage',
        default: null,
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent',
    },
    readBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
    }],
}, { timestamps: true });

// Primary query: paginated messages for a chat room
chatMessageSchema.index({ chatRoom: 1, createdAt: -1 });

// Unread message count: find undelivered messages for a user
chatMessageSchema.index({ chatRoom: 1, sender: 1, status: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
