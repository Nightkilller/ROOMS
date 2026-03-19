const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    roomCode: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nickname: { type: String, default: '' },
    text: { type: String, default: '', maxlength: 2000 },
    messageType: { type: String, enum: ['text', 'image', 'pdf', 'file', 'video', 'voice'], default: 'text' },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    reactions: { type: Map, of: [String], default: {} },
}, { timestamps: true });

// Compound index for fetching room messages in order
messageSchema.index({ roomCode: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
