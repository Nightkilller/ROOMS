const crypto = require('crypto');
const Room = require('../models/Room');
const Message = require('../models/Message');

const DURATIONS = {
    '10m': 10 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
};

function generateCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

// Strip HTML/script tags for XSS prevention
function sanitize(str) {
    return str.replace(/<[^>]*>/g, '').trim();
}

// ── CREATE ROOM ──────────────────────────────────────────────
exports.createRoom = async (req, res) => {
    try {
        const { name, duration } = req.body;
        if (!duration || !DURATIONS[duration]) {
            return res.status(400).json({ message: 'Invalid duration. Choose: 10m, 30m, 1h, 6h, 24h' });
        }

        // Generate unique code
        let roomCode;
        let attempts = 0;
        do {
            roomCode = generateCode();
            attempts++;
        } while (await Room.findOne({ roomCode }) && attempts < 10);

        const expiresAt = new Date(Date.now() + DURATIONS[duration]);

        const room = await Room.create({
            roomCode,
            name: name ? sanitize(name).slice(0, 60) : 'Untitled Room',
            hostUser: req.user.id,
            expiresAt,
            participants: [{ userId: req.user.id }],
        });

        res.status(201).json({
            roomCode: room.roomCode,
            name: room.name,
            expiresAt: room.expiresAt,
            hostUser: req.user.id,
        });
    } catch (err) {
        console.error('Create room error:', err);
        res.status(500).json({ message: 'Failed to create room' });
    }
};

// ── JOIN ROOM ────────────────────────────────────────────────
exports.joinRoom = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: 'Room code required' });

        const room = await Room.findOne({ roomCode: code.toUpperCase(), isActive: true });
        if (!room) return res.status(404).json({ message: 'Room not found or expired.' });
        if (room.isExpired()) {
            room.isActive = false;
            await room.save();
            return res.status(410).json({ message: 'Room not found or expired.' });
        }

        // Add to participants if not already there
        const already = room.participants.some(p => p.userId.toString() === req.user.id);
        if (!already) {
            room.participants.push({ userId: req.user.id });
            await room.save();
        }

        res.json({
            roomCode: room.roomCode,
            name: room.name,
            expiresAt: room.expiresAt,
            hostUser: room.hostUser,
        });
    } catch (err) {
        console.error('Join room error:', err);
        res.status(500).json({ message: 'Failed to join room' });
    }
};

// ── GET ROOM INFO ────────────────────────────────────────────
exports.getRoomInfo = async (req, res) => {
    try {
        const room = await Room.findOne({ roomCode: req.params.code.toUpperCase(), isActive: true })
            .populate('participants.userId', 'fullName email')
            .populate('hostUser', 'fullName email');

        if (!room) return res.status(404).json({ message: 'Room not found or expired.' });
        if (room.isExpired()) {
            room.isActive = false;
            await room.save();
            return res.status(410).json({ message: 'Room not found or expired.' });
        }

        // Fetch recent messages
        const messages = await Message.find({ roomCode: room.roomCode })
            .sort({ createdAt: 1 })
            .limit(200)
            .lean();

        res.json({
            roomCode: room.roomCode,
            name: room.name,
            expiresAt: room.expiresAt,
            hostUser: room.hostUser,
            participants: room.participants,
            messages,
            isHost: room.hostUser._id.toString() === req.user.id,
        });
    } catch (err) {
        console.error('Get room error:', err);
        res.status(500).json({ message: 'Failed to get room info' });
    }
};

// ── LEAVE ROOM ───────────────────────────────────────────────
exports.leaveRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomCode: req.params.code.toUpperCase() });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        room.participants = room.participants.filter(p => p.userId.toString() !== req.user.id);
        await room.save();

        res.json({ message: 'Left room' });
    } catch (err) {
        console.error('Leave room error:', err);
        res.status(500).json({ message: 'Failed to leave room' });
    }
};
