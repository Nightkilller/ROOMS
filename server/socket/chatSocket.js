const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

// Track online users: userId (string) → Set of socketIds
// Exported so videoSocket can use it for private call signaling
const chatOnlineUsers = new Map();
const userPresence = new Map();
const msgThrottle = new Map();

module.exports = (io, socket) => {
    const userId = String(socket.userId);

    // ── Mark user online ─────────────────────────────────────
    if (!chatOnlineUsers.has(userId)) chatOnlineUsers.set(userId, new Set());
    chatOnlineUsers.get(userId).add(socket.id);
    userPresence.set(userId, { online: true, lastSeen: new Date() });
    io.emit('chat:user-online', { userId, online: true });

    // ── Auto-join all chat rooms on connect ───────────────────
    const joinUserChatRooms = async () => {
        try {
            const rooms = await ChatRoom.find({ participants: userId }).select('_id');
            rooms.forEach(room => socket.join(`chat:${room._id}`));

            await ChatMessage.updateMany(
                {
                    sender: { $ne: userId },
                    'readBy.user': { $ne: userId },
                    status: 'sent',
                    chatRoom: { $in: rooms.map(r => r._id) },
                },
                { $set: { status: 'delivered' } }
            );
        } catch (err) {
            console.error('Auto-join chat rooms error:', err);
        }
    };
    joinUserChatRooms();

    // ── Join a specific chat room ────────────────────────────
    socket.on('chat:join', ({ roomId }) => {
        if (!roomId) return;
        socket.join(`chat:${roomId}`);
    });

    // ── Send message ─────────────────────────────────────────
    socket.on('chat:send', async ({ roomId, text, messageType, fileUrl, fileName, fileSize, replyTo }) => {
        try {
            if (!roomId) return;

            // Rate limit: 1 msg per 300ms per room
            const key = `${userId}:${roomId}`;
            const now = Date.now();
            if (msgThrottle.has(key) && now - msgThrottle.get(key) < 300) {
                socket.emit('chat:error', { message: 'Slow down! Too many messages.' });
                return;
            }
            msgThrottle.set(key, now);

            // Verify user is participant
            const room = await ChatRoom.findOne({ _id: roomId, participants: userId });
            if (!room) {
                socket.emit('chat:error', { message: 'Chat not found.' });
                return;
            }

            const sanitizedText = text ? text.replace(/<[^>]*>/g, '').trim().slice(0, 5000) : '';
            const type = messageType || 'text';

            if (type === 'text' && !sanitizedText) return;

            // Build message payload
            const msgData = {
                chatRoom: roomId,
                sender: userId,
                messageType: type,
                text: sanitizedText,
                fileUrl: fileUrl || '',
                fileName: fileName || '',
                fileSize: fileSize || 0,
                status: 'sent',
            };

            // Attach reply reference if provided
            if (replyTo) msgData.replyTo = replyTo;

            const message = await ChatMessage.create(msgData);

            // Populate sender info + replyTo message
            const populated = await ChatMessage.findById(message._id)
                .populate('sender', 'fullName email')
                .populate({
                    path: 'replyTo',
                    select: 'text messageType fileName sender',
                    populate: { path: 'sender', select: 'fullName' },
                })
                .lean();

            // Update lastMessage on the ChatRoom
            await ChatRoom.findByIdAndUpdate(roomId, {
                lastMessage: {
                    text: type === 'text' ? sanitizedText.slice(0, 100) : `📎 ${fileName || type}`,
                    sender: userId,
                    messageType: type,
                    timestamp: message.createdAt,
                },
            });

            // Broadcast to room
            io.to(`chat:${roomId}`).emit('chat:message', populated);

            // Mark as delivered for online recipients
            const recipientIds = room.participants
                .filter(p => p.toString() !== userId)
                .map(p => p.toString());

            const onlineRecipients = recipientIds.filter(id => chatOnlineUsers.has(id));
            if (onlineRecipients.length > 0) {
                await ChatMessage.findByIdAndUpdate(message._id, { status: 'delivered' });
                io.to(`chat:${roomId}`).emit('chat:status-update', {
                    messageId: message._id,
                    status: 'delivered',
                });
            }
        } catch (err) {
            console.error('chat:send error:', err);
            socket.emit('chat:error', { message: 'Failed to send message.' });
        }
    });

    // ── Typing indicators ────────────────────────────────────
    socket.on('chat:typing', ({ roomId }) => {
        if (!roomId) return;
        socket.to(`chat:${roomId}`).emit('chat:typing', { userId, roomId });
    });

    socket.on('chat:stop-typing', ({ roomId }) => {
        if (!roomId) return;
        socket.to(`chat:${roomId}`).emit('chat:stop-typing', { userId, roomId });
    });

    // ── Screenshot detected ──────────────────────────────────
    socket.on('chat:screenshot', async ({ roomId }) => {
        if (!roomId) return;
        const user = await User.findById(userId).select('fullName');
        io.to(`chat:${roomId}`).emit('chat:screenshot', {
            userId,
            fullName: user?.fullName || 'Someone',
            timestamp: new Date(),
        });
    });

    // ── Read receipts ────────────────────────────────────────
    socket.on('chat:read', async ({ roomId, messageIds }) => {
        try {
            if (!roomId || !messageIds?.length) return;

            await ChatMessage.updateMany(
                {
                    _id: { $in: messageIds },
                    chatRoom: roomId,
                    sender: { $ne: userId },
                },
                {
                    $set: { status: 'read' },
                    $addToSet: { readBy: { user: userId, readAt: new Date() } },
                }
            );

            io.to(`chat:${roomId}`).emit('chat:read-update', {
                roomId,
                messageIds,
                readBy: userId,
                readAt: new Date(),
            });
        } catch (err) {
            console.error('chat:read error:', err);
        }
    });

    // ── Get online status ────────────────────────────────────
    socket.on('chat:get-online-users', (callback) => {
        if (typeof callback !== 'function') return;
        const onlineList = [];
        for (const [uid, presence] of userPresence) {
            if (presence.online) onlineList.push(uid);
        }
        callback(onlineList);
    });

    // ── Disconnect cleanup ───────────────────────────────────
    socket.on('disconnect', () => {
        const socks = chatOnlineUsers.get(userId);
        if (socks) {
            socks.delete(socket.id);
            if (socks.size === 0) {
                chatOnlineUsers.delete(userId);
                userPresence.set(userId, { online: false, lastSeen: new Date() });
                io.emit('chat:user-online', { userId, online: false });
            }
        }
    });
};

// Export the socket map so videoSocket can use it for private call signaling
module.exports.chatOnlineUsers = chatOnlineUsers;
