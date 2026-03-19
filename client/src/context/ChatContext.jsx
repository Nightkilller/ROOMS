import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { getMyChats } from '../api/chatApi';

const ChatContext = createContext(null);
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const socket = useSocket();
    const { user } = useAuth();

    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [typingUsers, setTypingUsers] = useState({}); // roomId → Set of userIds
    const [unreadMap, setUnreadMap] = useState({});      // roomId → count
    const typingTimers = useRef({});

    const myId = user?.id || user?._id;

    // ── Load chats on mount ─────────────────────────────────
    const loadChats = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await getMyChats();
            setChats(data);
            // Build unread map
            const umap = {};
            data.forEach(c => { if (c.unreadCount) umap[c._id] = c.unreadCount; });
            setUnreadMap(umap);
        } catch (err) {
            console.error('Failed to load chats:', err);
        }
    }, [user]);

    useEffect(() => { loadChats(); }, [loadChats]);

    // ── Socket event listeners ──────────────────────────────
    useEffect(() => {
        if (!socket || !user) return;

        // Get initial online users
        socket.emit('chat:get-online-users', (onlineList) => {
            setOnlineUsers(new Set(onlineList));
        });

        // Incoming message
        const onMessage = (message) => {
            // Add to messages if it's for the active chat
            setMessages(prev => {
                if (prev.length > 0 && prev[0]?.chatRoom === message.chatRoom) {
                    return [...prev, message];
                }
                return prev;
            });

            // Update chat list's lastMessage
            setChats(prev => {
                const updated = prev.map(c => {
                    if (c._id === message.chatRoom) {
                        return {
                            ...c,
                            lastMessage: {
                                text: message.text || `📎 ${message.fileName || message.messageType}`,
                                sender: message.sender,
                                messageType: message.messageType,
                                timestamp: message.createdAt,
                            },
                            updatedAt: message.createdAt,
                        };
                    }
                    return c;
                });
                // Resort by updatedAt
                return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            });

            // Update unread count if not active chat
            if (message.sender?._id !== myId && message.chatRoom !== activeChat?._id) {
                setUnreadMap(prev => ({
                    ...prev,
                    [message.chatRoom]: (prev[message.chatRoom] || 0) + 1,
                }));
            }
        };

        // Status update (delivered/read)
        const onStatusUpdate = ({ messageId, status }) => {
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, status } : m
            ));
        };

        // Read update
        const onReadUpdate = ({ roomId, messageIds, readBy, readAt }) => {
            setMessages(prev => prev.map(m => {
                if (messageIds.includes(m._id)) {
                    const existing = m.readBy || [];
                    const alreadyRead = existing.some(r => r.user === readBy || r.user?._id === readBy);
                    if (!alreadyRead) {
                        return {
                            ...m,
                            status: 'read',
                            readBy: [...existing, { user: readBy, readAt }],
                        };
                    }
                }
                return m;
            }));
        };

        // Typing
        const onTyping = ({ userId: typingId, roomId }) => {
            if (typingId === myId) return;
            setTypingUsers(prev => {
                const set = new Set(prev[roomId] || []);
                set.add(typingId);
                return { ...prev, [roomId]: set };
            });

            // Clear after 3s
            const timerKey = `${roomId}:${typingId}`;
            clearTimeout(typingTimers.current[timerKey]);
            typingTimers.current[timerKey] = setTimeout(() => {
                setTypingUsers(prev => {
                    const set = new Set(prev[roomId] || []);
                    set.delete(typingId);
                    return { ...prev, [roomId]: set };
                });
            }, 3000);
        };

        const onStopTyping = ({ userId: typingId, roomId }) => {
            setTypingUsers(prev => {
                const set = new Set(prev[roomId] || []);
                set.delete(typingId);
                return { ...prev, [roomId]: set };
            });
        };

        // Online status
        const onUserOnline = ({ userId: uid, online }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                if (online) next.add(uid);
                else next.delete(uid);
                return next;
            });
        };

        socket.on('chat:message', onMessage);
        socket.on('chat:status-update', onStatusUpdate);
        socket.on('chat:read-update', onReadUpdate);
        socket.on('chat:typing', onTyping);
        socket.on('chat:stop-typing', onStopTyping);
        socket.on('chat:user-online', onUserOnline);

        return () => {
            socket.off('chat:message', onMessage);
            socket.off('chat:status-update', onStatusUpdate);
            socket.off('chat:read-update', onReadUpdate);
            socket.off('chat:typing', onTyping);
            socket.off('chat:stop-typing', onStopTyping);
            socket.off('chat:user-online', onUserOnline);
        };
    }, [socket, user, myId, activeChat]);

    // ── Send message via socket ─────────────────────────────
    const sendMessage = useCallback((roomId, { text, messageType, fileUrl, fileName, fileSize, replyTo }) => {
        if (!socket) return;
        socket.emit('chat:send', { roomId, text, messageType, fileUrl, fileName, fileSize, replyTo });
    }, [socket]);

    // ── Typing ──────────────────────────────────────────────
    const emitTyping = useCallback((roomId) => {
        if (!socket) return;
        socket.emit('chat:typing', { roomId });
    }, [socket]);

    const emitStopTyping = useCallback((roomId) => {
        if (!socket) return;
        socket.emit('chat:stop-typing', { roomId });
    }, [socket]);

    // ── Mark messages as read ───────────────────────────────
    const markAsRead = useCallback((roomId, messageIds) => {
        if (!socket || !messageIds?.length) return;
        socket.emit('chat:read', { roomId, messageIds });
        setUnreadMap(prev => ({ ...prev, [roomId]: 0 }));
    }, [socket]);

    // ── Join room (socket) ──────────────────────────────────
    const joinChatRoom = useCallback((roomId) => {
        if (!socket) return;
        socket.emit('chat:join', { roomId });
    }, [socket]);

    // ── Total unread count ──────────────────────────────────
    const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

    return (
        <ChatContext.Provider value={{
            chats, setChats, loadChats,
            activeChat, setActiveChat,
            messages, setMessages,
            onlineUsers, typingUsers,
            unreadMap, totalUnread,
            sendMessage, emitTyping, emitStopTyping,
            markAsRead, joinChatRoom,
        }}>
            {children}
        </ChatContext.Provider>
    );
};
