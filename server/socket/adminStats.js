const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');

let onlineUsers = new Set();
const roomOnlineUsers = new Map();   // roomCode → Set of userId
const userSockets = new Map();       // userId → Set of socketIds
const msgThrottle = new Map();       // `${userId}:${roomCode}` → lastTimestamp

module.exports = (io, app) => {
    // ── AUTH MIDDLEWARE ───────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        } catch (err) {
            return next(new Error('Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        onlineUsers.add(socket.userId);
        if (!userSockets.has(socket.userId)) userSockets.set(socket.userId, new Set());
        userSockets.get(socket.userId).add(socket.id);
        app.set('onlineUsers', onlineUsers.size);
        broadcastStats(io, app);

        // Admin joins stats room
        if (socket.userRole === 'admin') socket.join('admin-stats');

        // ── JOIN ROOM (chat) ─────────────────────────────────
        socket.on('join-room', async ({ roomCode, nickname }) => {
            try {
                console.log(`[join-room] userId=${socket.userId} roomCode=${roomCode} nickname=${nickname}`);
                const room = await Room.findOne({ roomCode, isActive: true });
                if (!room || room.isExpired()) {
                    socket.emit('room-error', { message: 'Room not found or expired.' });
                    return;
                }

                socket.join(`room:${roomCode}`);
                console.log(`[join-room] socket ${socket.id} joined room:${roomCode}`);
                socket.currentRoom = roomCode;

                // Track online users for room
                if (!roomOnlineUsers.has(roomCode)) roomOnlineUsers.set(roomCode, new Set());
                roomOnlineUsers.get(roomCode).add(socket.userId);

                // Update nickname if provided
                if (nickname) {
                    const p = room.participants.find(p => p.userId.toString() === socket.userId);
                    if (p) {
                        p.nickname = nickname.replace(/<[^>]*>/g, '').slice(0, 30);
                        await room.save();
                    }
                }

                // Broadcast updated participant list
                await broadcastParticipants(io, roomCode);

                // Schedule expiration notification
                const msLeft = room.expiresAt.getTime() - Date.now();
                if (msLeft > 0) {
                    setTimeout(async () => {
                        const r = await Room.findOne({ roomCode });
                        if (r && r.isActive) {
                            r.isActive = false;
                            await r.save();
                            io.to(`room:${roomCode}`).emit('room-expired', { message: 'This room has expired.' });
                            // Clean up messages after a short delay
                            setTimeout(() => Message.deleteMany({ roomCode }).catch(() => { }), 5000);
                        }
                    }, msLeft);
                }
            } catch (err) {
                console.error('join-room error:', err);
                socket.emit('room-error', { message: 'Failed to join room' });
            }
        });

        // ── SEND MESSAGE ─────────────────────────────────────
        socket.on('send-message', async ({ roomCode, text, messageType, fileUrl, fileName, fileSize }) => {
            try {
                console.log(`[send-message] userId=${socket.userId} roomCode=${roomCode} type=${messageType || 'text'}`);
                if (!roomCode) return;
                if (!text && !fileUrl) return;

                // Rate limit: 1 msg per 500ms
                const key = `${socket.userId}:${roomCode}`;
                const now = Date.now();
                if (msgThrottle.has(key) && now - msgThrottle.get(key) < 500) {
                    socket.emit('room-error', { message: 'Slow down! Max 1 message per 500ms.' });
                    return;
                }
                msgThrottle.set(key, now);

                const room = await Room.findOne({ roomCode, isActive: true });
                if (!room || room.isExpired()) {
                    socket.emit('room-error', { message: 'Room expired' });
                    return;
                }

                // Get sender nickname
                const participant = room.participants.find(p => p.userId.toString() === socket.userId);
                const user = await User.findById(socket.userId).select('fullName');
                const nickname = participant?.nickname || user?.fullName || 'Anonymous';

                // Sanitize message text
                const sanitized = text ? text.replace(/<[^>]*>/g, '').trim().slice(0, 2000) : '';

                const message = await Message.create({
                    room: room._id,
                    roomCode,
                    sender: socket.userId,
                    nickname,
                    text: sanitized,
                    messageType: messageType || 'text',
                    fileUrl: fileUrl || '',
                    fileName: fileName || '',
                    fileSize: fileSize || 0,
                });

                io.to(`room:${roomCode}`).emit('room-message', {
                    _id: message._id,
                    sender: socket.userId,
                    nickname,
                    text: sanitized,
                    messageType: message.messageType,
                    fileUrl: message.fileUrl,
                    fileName: message.fileName,
                    fileSize: message.fileSize,
                    reactions: {},
                    createdAt: message.createdAt,
                });
                console.log(`[send-message] broadcast to room:${roomCode} OK`);
            } catch (err) {
                console.error('send-message error:', err);
            }
        });

        // ── TYPING INDICATOR ─────────────────────────────────
        socket.on('typing', ({ roomCode, nickname }) => {
            if (!roomCode) return;
            socket.to(`room:${roomCode}`).emit('user-typing', {
                userId: socket.userId,
                nickname: nickname || 'Someone',
            });
        });

        // ── SCREENSHOT DETECTED ──────────────────────────────
        socket.on('screenshot-detected', async ({ roomCode, nickname }) => {
            if (!roomCode) return;
            const user = await User.findById(socket.userId).select('fullName');
            const displayName = nickname || user?.fullName || 'Someone';
            io.to(`room:${roomCode}`).emit('screenshot-detected', {
                userId: socket.userId,
                nickname: displayName,
                timestamp: new Date(),
            });
        });

        // ── SET NICKNAME ─────────────────────────────────────
        socket.on('set-nickname', async ({ roomCode, nickname }) => {
            try {
                if (!nickname || !roomCode) return;
                const clean = nickname.replace(/<[^>]*>/g, '').trim().slice(0, 30);
                const room = await Room.findOne({ roomCode, isActive: true });
                if (!room) return;

                const p = room.participants.find(p => p.userId.toString() === socket.userId);
                if (p) {
                    p.nickname = clean;
                    await room.save();
                    await broadcastParticipants(io, roomCode);
                }
            } catch (err) {
                console.error('set-nickname error:', err);
            }
        });

        // ── MESSAGE REACTION ─────────────────────────────────
        socket.on('message-reaction', async ({ messageId, emoji, roomCode }) => {
            try {
                const msg = await Message.findById(messageId);
                if (!msg) return;

                const users = msg.reactions.get(emoji) || [];
                const idx = users.indexOf(socket.userId);
                if (idx > -1) users.splice(idx, 1);
                else users.push(socket.userId);
                msg.reactions.set(emoji, users);
                await msg.save();

                io.to(`room:${roomCode}`).emit('message-reaction-update', {
                    messageId, emoji, users,
                });
            } catch (err) {
                console.error('reaction error:', err);
            }
        });

        // ── LEAVE ROOM ───────────────────────────────────────
        socket.on('leave-room', async ({ roomCode }) => {
            socket.leave(`room:${roomCode}`);
            if (socket.currentRoom === roomCode) socket.currentRoom = null;
            if (roomOnlineUsers.has(roomCode)) {
                roomOnlineUsers.get(roomCode).delete(socket.userId);
                await broadcastParticipants(io, roomCode);
            }
        });

        // ── ADMIN: TERMINATE ROOM ────────────────────────────
        socket.on('admin-terminate-room', async ({ roomCode }) => {
            if (socket.userRole !== 'admin') return;
            try {
                const room = await Room.findOne({ roomCode });
                if (room) {
                    room.isActive = false;
                    await room.save();
                    io.to(`room:${roomCode}`).emit('room-terminated', { message: 'This room has been terminated by an admin.' });
                    setTimeout(() => Message.deleteMany({ roomCode }).catch(() => { }), 2000);
                }
            } catch (err) {
                console.error('admin terminate error:', err);
            }
        });

        // ── ADMIN: KICK USER ─────────────────────────────────
        socket.on('admin-kick-user', async ({ roomCode, targetUserId }) => {
            if (socket.userRole !== 'admin') return;
            try {
                const room = await Room.findOne({ roomCode });
                if (room) {
                    room.participants = room.participants.filter(p => p.userId.toString() !== targetUserId);
                    await room.save();

                    // Find and disconnect target sockets from room
                    const targetSocks = userSockets.get(targetUserId);
                    if (targetSocks) {
                        for (const sid of targetSocks) {
                            const s = io.sockets.sockets.get(sid);
                            if (s) {
                                s.emit('room-terminated', { message: 'You have been removed from this room.' });
                                s.leave(`room:${roomCode}`);
                            }
                        }
                    }
                    if (roomOnlineUsers.has(roomCode)) roomOnlineUsers.get(roomCode).delete(targetUserId);
                    await broadcastParticipants(io, roomCode);
                }
            } catch (err) {
                console.error('admin kick error:', err);
            }
        });

        // ── HOST: KICK USER (room creator can kick) ──────────
        socket.on('host-kick-user', async ({ roomCode, targetUserId }) => {
            try {
                const room = await Room.findOne({ roomCode, isActive: true });
                if (!room) return;
                // Only room host can kick
                if (room.hostUser.toString() !== socket.userId) {
                    socket.emit('room-error', { message: 'Only the room host can kick users.' });
                    return;
                }
                // Can't kick yourself
                if (targetUserId === socket.userId) return;

                room.participants = room.participants.filter(p => p.userId.toString() !== targetUserId);
                await room.save();

                const targetSocks = userSockets.get(targetUserId);
                if (targetSocks) {
                    for (const sid of targetSocks) {
                        const s = io.sockets.sockets.get(sid);
                        if (s) {
                            s.emit('room-terminated', { message: 'You have been kicked from this room by the host.' });
                            s.leave(`room:${roomCode}`);
                        }
                    }
                }
                if (roomOnlineUsers.has(roomCode)) roomOnlineUsers.get(roomCode).delete(targetUserId);
                await broadcastParticipants(io, roomCode);
            } catch (err) {
                console.error('host kick error:', err);
            }
        });

        // ── DISCONNECT ───────────────────────────────────────
        socket.on('disconnect', async () => {
            const socks = userSockets.get(socket.userId);
            if (socks) {
                socks.delete(socket.id);
                if (socks.size === 0) {
                    userSockets.delete(socket.userId);
                    onlineUsers.delete(socket.userId);

                    // Remove from all room online lists
                    for (const [code, users] of roomOnlineUsers) {
                        if (users.has(socket.userId)) {
                            users.delete(socket.userId);
                            await broadcastParticipants(io, code);
                        }
                    }
                }
            }
            app.set('onlineUsers', onlineUsers.size);
            broadcastStats(io, app);
        });
    });

    // ── EXPIRY SWEEP (every 60s) ─────────────────────────────
    setInterval(async () => {
        try {
            const expired = await Room.find({ isActive: true, expiresAt: { $lte: new Date() } });
            for (const room of expired) {
                room.isActive = false;
                await room.save();
                io.to(`room:${room.roomCode}`).emit('room-expired', { message: 'This room has expired.' });
                await Message.deleteMany({ roomCode: room.roomCode });
                roomOnlineUsers.delete(room.roomCode);
            }
        } catch (err) {
            console.error('Expiry sweep error:', err);
        }
    }, 60000);
};

// ── HELPERS ──────────────────────────────────────────────────
async function broadcastStats(io, app) {
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

        io.to('admin-stats').emit('stats_update', {
            total,
            online: app.get('onlineUsers') || 0,
            newToday,
            newThisWeek,
        });
    } catch (err) {
        console.error('Stats broadcast error:', err);
    }
}

async function broadcastParticipants(io, roomCode) {
    try {
        const room = await Room.findOne({ roomCode }).populate('participants.userId', 'fullName email');
        if (!room) return;
        const onlineSet = roomOnlineUsers.get(roomCode) || new Set();

        const participants = room.participants.map(p => ({
            userId: p.userId._id,
            fullName: p.userId.fullName,
            email: p.userId.email,
            nickname: p.nickname,
            joinedAt: p.joinedAt,
            isOnline: onlineSet.has(p.userId._id.toString()),
        }));

        io.to(`room:${roomCode}`).emit('room-participants', participants);
    } catch (err) {
        console.error('Broadcast participants error:', err);
    }
}

// Export the socket map so videoSocket can use it for call signaling
module.exports.userSockets = userSockets;
