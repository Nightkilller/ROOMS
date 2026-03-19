const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

// ── CREATE OR GET DIRECT MESSAGE ROOM ────────────────────────
exports.createOrGetDM = async (req, res) => {
    try {
        const { userId } = req.body;
        const myId = req.user.id;

        if (userId === myId) {
            return res.status(400).json({ message: 'Cannot create a chat with yourself.' });
        }

        // Check target user exists
        const targetUser = await User.findById(userId).select('fullName email');
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if DM already exists between these two users
        const existing = await ChatRoom.findOne({
            type: 'direct',
            participants: { $all: [myId, userId], $size: 2 },
        }).populate('participants', 'fullName email');

        if (existing) {
            return res.json(existing);
        }

        // Create new DM room
        const room = await ChatRoom.create({
            type: 'direct',
            participants: [myId, userId],
            createdBy: myId,
        });

        const populated = await ChatRoom.findById(room._id)
            .populate('participants', 'fullName email');

        res.status(201).json(populated);
    } catch (err) {
        console.error('Create DM error:', err);
        res.status(500).json({ message: 'Failed to create conversation.' });
    }
};

// ── CREATE GROUP CHAT ────────────────────────────────────────
exports.createGroup = async (req, res) => {
    try {
        const { name, participantIds } = req.body;
        const myId = req.user.id;

        if (!participantIds || participantIds.length < 1) {
            return res.status(400).json({ message: 'At least 1 other participant required.' });
        }

        // Ensure creator is included
        const allParticipants = [...new Set([myId, ...participantIds])];

        // Verify all participants exist
        const count = await User.countDocuments({ _id: { $in: allParticipants } });
        if (count !== allParticipants.length) {
            return res.status(400).json({ message: 'One or more users not found.' });
        }

        const room = await ChatRoom.create({
            type: 'group',
            name: name ? name.replace(/<[^>]*>/g, '').trim().slice(0, 100) : 'Group Chat',
            participants: allParticipants,
            createdBy: myId,
        });

        const populated = await ChatRoom.findById(room._id)
            .populate('participants', 'fullName email');

        res.status(201).json(populated);
    } catch (err) {
        console.error('Create group error:', err);
        res.status(500).json({ message: 'Failed to create group.' });
    }
};

// ── GET MY CHATS ─────────────────────────────────────────────
exports.getMyChats = async (req, res) => {
    try {
        const myId = req.user.id;

        const chats = await ChatRoom.find({ participants: myId })
            .populate('participants', 'fullName email')
            .populate('lastMessage.sender', 'fullName')
            .sort({ updatedAt: -1 })
            .lean();

        // Attach unread counts
        const chatIds = chats.map(c => c._id);
        const unreadCounts = await ChatMessage.aggregate([
            {
                $match: {
                    chatRoom: { $in: chatIds },
                    sender: { $ne: myId },
                    'readBy.user': { $ne: myId },
                },
            },
            { $group: { _id: '$chatRoom', count: { $sum: 1 } } },
        ]);

        const unreadMap = {};
        unreadCounts.forEach(u => { unreadMap[u._id.toString()] = u.count; });

        const result = chats.map(chat => ({
            ...chat,
            unreadCount: unreadMap[chat._id.toString()] || 0,
        }));

        res.json(result);
    } catch (err) {
        console.error('Get chats error:', err);
        res.status(500).json({ message: 'Failed to load chats.' });
    }
};

// ── GET MESSAGES (PAGINATED) ─────────────────────────────────
exports.getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const myId = req.user.id;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const before = req.query.before; // cursor: ISO date string

        // Verify user is participant
        const room = await ChatRoom.findOne({
            _id: roomId,
            participants: myId,
        });

        if (!room) {
            return res.status(404).json({ message: 'Chat not found.' });
        }

        const query = { chatRoom: roomId };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await ChatMessage.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('sender', 'fullName email')
            .populate('readBy.user', 'fullName')
            .lean();

        // Return in chronological order
        messages.reverse();

        const hasMore = messages.length === limit;

        res.json({ messages, hasMore });
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ message: 'Failed to load messages.' });
    }
};

// ── SEARCH USERS ─────────────────────────────────────────────
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const myId = req.user.id;

        if (!q || q.length < 2) {
            return res.json([]);
        }

        const sanitized = q.replace(/<[^>]*>/g, '').trim();
        const regex = new RegExp(sanitized, 'i');

        const users = await User.find({
            _id: { $ne: myId },
            isVerified: true,
            $or: [
                { fullName: regex },
                { email: regex },
            ],
        })
            .select('fullName email')
            .limit(20)
            .lean();

        res.json(users);
    } catch (err) {
        console.error('Search users error:', err);
        res.status(500).json({ message: 'Search failed.' });
    }
};


