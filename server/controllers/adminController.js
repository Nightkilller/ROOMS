const User = require('../models/User');
const LoginSession = require('../models/LoginSession');
const RefreshToken = require('../models/RefreshToken');
const AuditLog = require('../models/AuditLog');
const AdminNote = require('../models/AdminNote');
const Room = require('../models/Room');
const Message = require('../models/Message');

const logAudit = async (adminId, action, targetUserId, details) => {
    await AuditLog.create({ adminId, action, targetUserId, details });
};

// ── LIVE STATS ────────────────────────────────────────────────
exports.getStats = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        const [total, newToday, newThisWeek] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: todayStart } }),
            User.countDocuments({ createdAt: { $gte: weekStart } }),
        ]);

        res.json({ total, newToday, newThisWeek, online: req.app.get('onlineUsers') || 0 });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── CHART DATA ────────────────────────────────────────────────
exports.getChartData = async (req, res) => {
    try {
        const now = new Date();

        // Signups per day (last 30 days)
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const signups = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        // Logins per day (last 7 days)
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const logins = await LoginSession.aggregate([
            { $match: { loginAt: { $gte: sevenDaysAgo }, successful: true } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$loginAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        // Device breakdown
        const devices = await LoginSession.aggregate([
            { $match: { successful: true } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $regexMatch: { input: { $toLower: '$device' }, regex: /mobile|iphone|android/ } }, 'Mobile',
                            { $cond: [{ $regexMatch: { input: { $toLower: '$device' }, regex: /tablet|ipad/ } }, 'Tablet', 'Desktop'] },
                        ],
                    },
                    count: { $sum: 1 },
                },
            },
        ]);

        res.json({
            signups: signups.map((s) => ({ date: s._id, count: s.count })),
            logins: logins.map((l) => ({ date: l._id, count: l.count })),
            devices: devices.map((d) => ({ name: d._id, value: d.count })),
        });
    } catch (err) {
        console.error('Chart data error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── USER LIST ─────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, status, sortBy = 'createdAt', order = 'desc', from, to } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (status === 'verified') query.isVerified = true;
        if (status === 'unverified') query.isVerified = false;
        if (status === 'locked') query.isLocked = true;
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

        const [users, total] = await Promise.all([
            User.find(query).select('-passwordHash -otpHash -resetSessionToken').sort(sortObj).skip(skip).limit(parseInt(limit)),
            User.countDocuments(query),
        ]);

        // Attach last login info
        const enriched = await Promise.all(
            users.map(async (u) => {
                const lastSession = await LoginSession.findOne({ userId: u._id, successful: true }).sort({ loginAt: -1 });
                return {
                    ...u.toObject(),
                    lastLogin: lastSession?.loginAt || null,
                    lastIP: lastSession?.ipAddress || null,
                    lastCity: lastSession?.city || null,
                    lastDevice: lastSession?.device || null,
                };
            })
        );

        res.json({ users: enriched, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── USER DETAIL ───────────────────────────────────────────────
exports.getUserDetail = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('-passwordHash -otpHash -resetSessionToken');
        if (!user) return res.status(404).json({ message: 'User not found.' });

        const sessions = await LoginSession.find({ userId }).sort({ loginAt: -1 });
        const notes = await AdminNote.find({ targetUserId: userId }).sort({ createdAt: -1 }).populate('adminId', 'fullName email');

        res.json({ user, sessions, notes });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── LOCK / UNLOCK ─────────────────────────────────────────────
exports.lockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        await logAudit(req.user.id, 'LOCK_USER', userId, `Locked user ${user.email}`);
        res.json({ message: 'User locked.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.unlockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        user.isLocked = false;
        user.lockUntil = null;
        user.failedLoginAttempts = 0;
        await user.save();

        await logAudit(req.user.id, 'UNLOCK_USER', userId, `Unlocked user ${user.email}`);
        res.json({ message: 'User unlocked.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── FORCE LOGOUT ──────────────────────────────────────────────
exports.forceLogout = async (req, res) => {
    try {
        const { userId } = req.params;
        await RefreshToken.deleteMany({ userId });
        await logAudit(req.user.id, 'FORCE_LOGOUT', userId, 'Force logged out all sessions');
        res.json({ message: 'User logged out of all devices.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── DELETE USER ───────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        await RefreshToken.deleteMany({ userId });
        await LoginSession.deleteMany({ userId });
        await AdminNote.deleteMany({ targetUserId: userId });
        await User.deleteOne({ _id: userId });

        await logAudit(req.user.id, 'DELETE_USER', userId, `Deleted user ${user.email}`);
        res.json({ message: 'User deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── ADMIN NOTES ───────────────────────────────────────────────
exports.addNote = async (req, res) => {
    try {
        const { userId } = req.params;
        const { note } = req.body;
        const created = await AdminNote.create({ adminId: req.user.id, targetUserId: userId, note });
        await logAudit(req.user.id, 'ADD_NOTE', userId, `Added note on user`);
        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── AUDIT LOG ─────────────────────────────────────────────────
exports.getAuditLog = async (req, res) => {
    try {
        const { page = 1, limit = 30 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [logs, total] = await Promise.all([
            AuditLog.find().sort({ performedAt: -1 }).skip(skip).limit(parseInt(limit))
                .populate('adminId', 'fullName email')
                .populate('targetUserId', 'fullName email'),
            AuditLog.countDocuments(),
        ]);
        res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── ROOM STATS ────────────────────────────────────────────────
exports.getRoomStats = async (req, res) => {
    try {
        const [totalRooms, activeRooms, totalMessages] = await Promise.all([
            Room.countDocuments(),
            Room.countDocuments({ isActive: true, expiresAt: { $gt: new Date() } }),
            Message.countDocuments(),
        ]);

        // Average room duration in minutes
        const rooms = await Room.find().select('createdAt expiresAt').lean();
        const avgDuration = rooms.length
            ? Math.round(rooms.reduce((sum, r) => sum + (r.expiresAt - r.createdAt) / 60000, 0) / rooms.length)
            : 0;

        res.json({ totalRooms, activeRooms, totalMessages, avgDuration });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── ACTIVE ROOMS LIST ─────────────────────────────────────────
exports.getActiveRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ isActive: true, expiresAt: { $gt: new Date() } })
            .populate('hostUser', 'fullName email')
            .sort({ createdAt: -1 })
            .lean();

        const enriched = rooms.map(r => ({
            roomCode: r.roomCode,
            name: r.name,
            host: r.hostUser?.fullName || 'Unknown',
            hostEmail: r.hostUser?.email || '',
            createdAt: r.createdAt,
            expiresAt: r.expiresAt,
            activeUsers: r.participants.length,
        }));

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── TERMINATE ROOM (admin) ────────────────────────────────────
exports.terminateRoom = async (req, res) => {
    try {
        const { code } = req.params;
        const room = await Room.findOne({ roomCode: code.toUpperCase() });
        if (!room) return res.status(404).json({ message: 'Room not found.' });

        room.isActive = false;
        await room.save();
        await Message.deleteMany({ roomCode: room.roomCode });

        await logAudit(req.user.id, 'TERMINATE_ROOM', null, `Terminated room ${room.roomCode}`);
        res.json({ message: 'Room terminated.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};
