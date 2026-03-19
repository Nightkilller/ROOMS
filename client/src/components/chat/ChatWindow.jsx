import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import useScreenshotDetection from '../../hooks/useScreenshotDetection';
import { getMessages } from '../../api/chatApi';
import FileUploadButton from './FileUploadButton';
import MessagePreview from './MessagePreview';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ChatWindow({ chat, onStartCall }) {
    const { user } = useAuth();
    const socket = useSocket();
    const { messages, setMessages, sendMessage, emitTyping, markAsRead, joinChatRoom, typingUsers } = useChat();
    const myId = user?.id || user?._id;

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [screenshotAlerts, setScreenshotAlerts] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);   // message being replied to
    const [recording, setRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [uploading, setUploading] = useState(false);

    const msgEndRef = useRef(null);
    const scrollRef = useRef(null);
    const typingTimer = useRef(null);
    const initialLoad = useRef(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordTimerRef = useRef(null);
    const messageRefs = useRef({});   // for scroll-to-original

    // ── Load messages when chat changes ──────────────────────
    useEffect(() => {
        if (!chat?._id) return;
        initialLoad.current = false;
        const load = async () => {
            setLoading(true);
            setReplyingTo(null);
            try {
                joinChatRoom(chat._id);
                const { data } = await getMessages(chat._id);
                setMessages(data.messages);
                setHasMore(data.hasMore);
                const unreadIds = data.messages
                    .filter(m => m.sender?._id !== myId && m.status !== 'read')
                    .map(m => m._id);
                if (unreadIds.length) markAsRead(chat._id, unreadIds);
            } catch (err) { console.error('Load messages error:', err); }
            setLoading(false);
            initialLoad.current = true;
        };
        load();
    }, [chat?._id]);

    // ── Auto-scroll on new messages ──────────────────────────
    useEffect(() => {
        if (initialLoad.current) msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Load older messages on scroll-up ─────────────────────
    const handleScroll = useCallback(async () => {
        if (!scrollRef.current || loading || !hasMore) return;
        if (scrollRef.current.scrollTop < 100) {
            const oldH = scrollRef.current.scrollHeight;
            setLoading(true);
            try {
                const oldest = messages[0]?.createdAt;
                const { data } = await getMessages(chat._id, oldest);
                setMessages(prev => [...data.messages, ...prev]);
                setHasMore(data.hasMore);
                requestAnimationFrame(() => {
                    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight - oldH;
                });
            } catch { }
            setLoading(false);
        }
    }, [loading, hasMore, messages, chat?._id]);

    // ── Mark new messages as read ────────────────────────────
    useEffect(() => {
        if (!chat?._id || !messages.length) return;
        const unreadIds = messages
            .filter(m => m.sender?._id !== myId && m.status !== 'read').map(m => m._id);
        if (unreadIds.length) markAsRead(chat._id, unreadIds);
    }, [messages, chat?._id, myId]);

    // ── Screenshot detection ─────────────────────────────────
    useScreenshotDetection(useCallback(() => {
        if (socket && chat?._id) socket.emit('chat:screenshot', { roomId: chat._id });
    }, [socket, chat?._id]), !!socket && !!chat?._id);

    useEffect(() => {
        if (!socket || !chat?._id) return;
        const onScreenshot = ({ userId: ssId, fullName, timestamp }) => {
            toast('📸 ' + (fullName || 'Someone') + ' took a screenshot!', {
                icon: '⚠️', style: { background: '#1a1a2e', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '12px' }, duration: 4000,
            });
            setScreenshotAlerts(prev => [...prev, { userId: ssId, fullName, timestamp: timestamp || new Date() }]);
        };
        socket.on('chat:screenshot', onScreenshot);
        return () => socket.off('chat:screenshot', onScreenshot);
    }, [socket, chat?._id]);

    // ── Send text or reply message ───────────────────────────
    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(chat._id, {
            text: input.trim(),
            messageType: 'text',
            replyTo: replyingTo?._id || null,
        });
        setInput('');
        setReplyingTo(null);
    };

    // ── File upload ──────────────────────────────────────────
    const handleFileUploaded = ({ messageType, fileUrl, fileName, fileSize }) => {
        sendMessage(chat._id, { text: '', messageType, fileUrl, fileName, fileSize, replyTo: replyingTo?._id || null });
        setReplyingTo(null);
    };

    // ── Voice recording ──────────────────────────────────────
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            mediaRecorderRef.current = mr;
            audioChunksRef.current = [];
            mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mr.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (blob.size < 500) { toast.error('Recording too short'); return; }
                setUploading(true);
                try {
                    const formData = new FormData();
                    formData.append('file', blob, `voice-${Date.now()}.webm`);
                    const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    sendMessage(chat._id, {
                        text: '', messageType: 'voice',
                        fileUrl: data.url, fileName: 'Voice message', fileSize: blob.size,
                        replyTo: replyingTo?._id || null,
                    });
                    setReplyingTo(null);
                } catch { toast.error('Voice upload failed'); }
                setUploading(false);
            };
            mr.start();
            setRecording(true);
            setRecordingTime(0);
            recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
        } catch { toast.error('Microphone access denied'); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
        setRecording(false);
        clearInterval(recordTimerRef.current);
    };
    const cancelRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.ondataavailable = null;
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
        }
        setRecording(false);
        setRecordingTime(0);
        clearInterval(recordTimerRef.current);
    };

    // ── Typing indicator ─────────────────────────────────────
    const handleInputChange = (e) => {
        setInput(e.target.value);
        emitTyping(chat._id);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => { }, 2000);
    };

    // ── Helpers ──────────────────────────────────────────────
    const getChatDisplayName = () => {
        if (chat.type === 'group') return chat.name || 'Group Chat';
        const other = chat.participants?.find(p => (p._id || p).toString() !== myId);
        return other?.fullName || 'User';
    };
    const getOtherParticipant = () => chat.participants?.find(p => (p._id || p).toString() !== myId);
    const getParticipantCount = () => chat.participants?.length || 0;
    const roomTyping = typingUsers[chat?._id];
    const typingDisplay = roomTyping?.size > 0
        ? `${roomTyping.size === 1 ? 'Someone is' : `${roomTyping.size} people are`} typing...`
        : null;

    const getStatusIcon = (msg) => {
        if (msg.sender?._id !== myId) return null;
        if (msg.status === 'read') return <span className="text-brand-400 text-[10px]" title="Read">✓✓</span>;
        if (msg.status === 'delivered') return <span className="text-zinc-400 text-[10px]" title="Delivered">✓✓</span>;
        return <span className="text-zinc-500 text-[10px]" title="Sent">✓</span>;
    };

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const scrollToMessage = (msgId) => {
        const el = messageRefs.current[msgId];
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2', 'ring-brand-400/60', 'ring-offset-2'); setTimeout(() => el.classList.remove('ring-2', 'ring-brand-400/60', 'ring-offset-2'), 1500); }
    };

    if (!chat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-dark-900 text-dark-300">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose a chat from the sidebar to start messaging</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-dark-900">
            {/* ── Header ─────────────────────────────────────── */}
            <div className="bg-dark-800 border-b border-brand-500/10 px-4 py-3 flex items-center gap-3 shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${chat.type === 'group' ? 'bg-gradient-to-br from-cyan-600 to-cyan-500' : 'bg-gradient-to-br from-brand-600 to-brand-500'}`}>
                    {chat.type === 'group' ? '👥' : getChatDisplayName()[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-sm truncate">{getChatDisplayName()}</h2>
                    <p className="text-xs text-dark-200">
                        {typingDisplay || (chat.type === 'group' ? `${getParticipantCount()} members` : 'Online')}
                    </p>
                </div>
                {onStartCall && chat.type !== 'group' && (() => {
                    const other = getOtherParticipant();
                    return other ? (
                        <div className="flex items-center gap-1">
                            {/* Audio call */}
                            <button onClick={() => onStartCall(other._id || other, other.fullName, 'audio')}
                                className="p-2 rounded-lg text-dark-100 hover:text-brand-400 hover:bg-brand-500/10 transition" title="Voice call">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </button>
                            {/* Video call */}
                            <button onClick={() => onStartCall(other._id || other, other.fullName, 'video')}
                                className="p-2 rounded-lg text-dark-100 hover:text-green-400 hover:bg-green-500/10 transition" title="Video call">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    ) : null;
                })()}
            </div>

            {/* ── Messages ─────────────────────────────────────── */}
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {loading && <div className="text-center py-2"><span className="text-xs text-dark-300 animate-pulse">Loading messages...</span></div>}
                {!loading && messages.length === 0 && (
                    <div className="text-center text-dark-300 text-sm py-16">
                        <p className="text-4xl mb-3">👋</p>
                        <p>No messages yet. Say hello!</p>
                    </div>
                )}

                {messages.map((msg, i) => {
                    const own = (msg.sender?._id || msg.sender)?.toString() === myId;
                    const senderName = msg.sender?.fullName || 'User';
                    const showName = !own && chat.type === 'group';

                    return (
                        <div key={msg._id || i}
                            ref={el => { if (el && msg._id) messageRefs.current[msg._id] = el; }}
                            className={`flex ${own ? 'justify-end' : 'justify-start'} group`}>
                            <div className="max-w-[75%]">
                                {showName && <p className="text-xs text-brand-400 font-medium mb-0.5 ml-1">{senderName}</p>}
                                <div className={`relative px-3.5 py-2 rounded-2xl transition-all ${own
                                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-br-sm'
                                    : 'bg-dark-700 text-dark-50 rounded-bl-sm'}`}>

                                    {/* Reply preview inside bubble */}
                                    {msg.replyTo && (
                                        <button onClick={() => scrollToMessage(msg.replyTo._id)}
                                            className={`text-left w-full mb-2 p-2 rounded-lg border-l-2 border-brand-400 ${own ? 'bg-white/10' : 'bg-dark-600'} hover:opacity-80 transition`}>
                                            <p className="text-[10px] font-semibold text-brand-300 mb-0.5">
                                                {msg.replyTo.sender?.fullName || 'User'}
                                            </p>
                                            <p className="text-xs truncate opacity-75">
                                                {msg.replyTo.messageType !== 'text' ? `📎 ${msg.replyTo.fileName || msg.replyTo.messageType}` : msg.replyTo.text}
                                            </p>
                                        </button>
                                    )}

                                    {/* File content */}
                                    {msg.messageType !== 'text' && msg.fileUrl && (
                                        <MessagePreview message={msg} />
                                    )}

                                    {/* Text content */}
                                    {msg.messageType === 'text' && msg.text && (
                                        <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    )}

                                    <div className={`flex items-center gap-1 mt-1 ${own ? 'justify-end' : ''}`}>
                                        <span className={`text-[10px] ${own ? 'text-white/50' : 'text-dark-300'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {getStatusIcon(msg)}
                                    </div>

                                    {/* Reply button on hover */}
                                    <button
                                        onClick={() => setReplyingTo(msg)}
                                        className={`absolute top-0 ${own ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-dark-600 hover:bg-dark-500 text-dark-200`}
                                        title="Reply">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={msgEndRef} />

                {/* Screenshot alerts */}
                {screenshotAlerts.map((alert, i) => (
                    <div key={`ss-${i}`} className="flex justify-center my-2 animate-fade-in">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-4 py-2 rounded-full flex items-center gap-2">
                            <span>📸</span>
                            <span><strong>{alert.fullName}</strong> took a screenshot</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Typing indicator ─────────────────────────── */}
            {typingDisplay && (
                <div className="px-4 pb-1">
                    <p className="text-xs text-dark-300 animate-pulse italic">{typingDisplay}</p>
                </div>
            )}

            {/* ── Reply preview bar ─────────────────────────── */}
            {replyingTo && (
                <div className="mx-3 mb-2 px-3 py-2 bg-dark-700 border-l-2 border-brand-400 rounded-xl flex items-center gap-3 animate-fade-in">
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-brand-300 mb-0.5">
                            Replying to {replyingTo.sender?.fullName || 'User'}
                        </p>
                        <p className="text-xs text-dark-200 truncate">
                            {replyingTo.messageType !== 'text' ? `📎 ${replyingTo.fileName || replyingTo.messageType}` : replyingTo.text}
                        </p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-dark-300 hover:text-white transition shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── Input area ───────────────────────────────── */}
            <div className="bg-dark-800 border-t border-brand-500/10 p-3 shrink-0">
                {recording ? (
                    /* Recording state */
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 flex-1 bg-dark-700 rounded-xl px-4 py-2.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                            <span className="text-sm text-red-400 font-mono shrink-0">{formatTime(recordingTime)}</span>
                            <span className="text-xs text-dark-300 truncate">Recording voice...</span>
                        </div>
                        <button onClick={cancelRecording} className="p-2.5 rounded-xl text-dark-200 hover:text-red-400 hover:bg-red-500/10 transition shrink-0" title="Cancel">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <button onClick={stopRecording} className="btn-primary px-4 py-2.5 text-sm shrink-0" title="Send">
                            Send
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <FileUploadButton onFileUploaded={handleFileUploaded} />
                        {/* Mic button */}
                        <button onClick={startRecording} disabled={uploading}
                            className="p-2.5 rounded-xl text-dark-200 hover:text-red-400 hover:bg-red-500/10 transition shrink-0 disabled:opacity-40" title="Record voice">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={replyingTo ? `Replying to ${replyingTo.sender?.fullName || 'User'}...` : 'Type a message...'}
                            className="input-field flex-1 py-2.5 min-w-0"
                            maxLength={5000}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="btn-primary px-4 py-2.5 text-sm shrink-0 disabled:opacity-40">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
