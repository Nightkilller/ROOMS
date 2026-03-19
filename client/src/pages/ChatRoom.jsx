import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useScreenshotDetection from '../hooks/useScreenshotDetection';
import api from '../api/axios';
import toast from 'react-hot-toast';

import VideoCall from '../components/chat/VideoCall';
import IncomingCallNotification from '../components/chat/IncomingCallNotification';
import ChatHeader from '../components/chat/ChatHeader';
import MessageBubble from '../components/chat/MessageBubble';
import ReplyPreview from '../components/chat/ReplyPreview';
import InputBar from '../components/chat/InputBar';
import RecordingBar from '../components/chat/RecordingBar';

/* ─────────────────────── WhatsApp-grade Chat Room ─────────────────────── */

export default function ChatRoom() {
    const { code } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();

    // ── Core State ────────────────────────────────────────────
    const [room, setRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [input, setInput] = useState('');
    const [nickname, setNickname] = useState('');
    const [nickInput, setNickInput] = useState('');
    const [showNickModal, setShowNickModal] = useState(true);
    const [typing, setTyping] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [uploading, setUploading] = useState(false);
    const [lightboxImg, setLightboxImg] = useState(null);

    // ── Recording State ───────────────────────────────────────
    const [recording, setRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [waveformBars, setWaveformBars] = useState(Array(24).fill(8));

    // ── Call State ────────────────────────────────────────────
    const [callConfig, setCallConfig] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [outgoingCall, setOutgoingCall] = useState(null);

    // ── New Interaction State ─────────────────────────────────
    const [replyTo, setReplyTo] = useState(null);          // message being replied to
    const [selectMode, setSelectMode] = useState(false);    // multi-select active
    const [selectedMessages, setSelectedMessages] = useState(new Set());
    const [highlightedMsgId, setHighlightedMsgId] = useState(null);

    // ── Refs ──────────────────────────────────────────────────
    const callStateRef = useRef({ outgoing: null, incoming: null });
    const joinedRef = useRef(false);
    const msgEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordTimerRef = useRef(null);
    const waveformAnalyserRef = useRef(null);
    const waveformCtxRef = useRef(null);
    const waveformRafRef = useRef(null);
    const msgRefs = useRef({});

    const myId = user?.id || user?._id;

    // ── Keep callStateRef synced ──────────────────────────────
    useEffect(() => {
        callStateRef.current = { outgoing: outgoingCall, incoming: incomingCall };
    }, [outgoingCall, incomingCall]);

    // ── Load room data ────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get(`/rooms/${code}`);
                setRoom(data);
                setMessages(data.messages || []);
                setParticipants(data.participants || []);
                const me = data.participants?.find(p => {
                    const pid = p.userId?._id || p.userId;
                    return pid?.toString() === myId?.toString();
                });
                if (me?.nickname) {
                    setNickname(me.nickname);
                    setNickInput(me.nickname);
                    setShowNickModal(false);
                }
            } catch (err) {
                toast.error(err.response?.data?.message || 'Room not found or expired.');
                navigate('/dashboard');
            }
        };
        load();
    }, [code, navigate, myId]);

    // ── WebRTC Call Flow ──────────────────────────────────────
    useEffect(() => {
        if (!socket || !myId) return;

        const onIncoming = ({ roomID, callerId, callerName, callType }) => {
            setIncomingCall({ roomID, callerId, callerName, callType });
        };

        const onCallAccepted = ({ roomID }) => {
            const { outgoing, incoming } = callStateRef.current;
            const isCaller = !!outgoing;
            const currentCallType = outgoing?.callType || incoming?.callType || 'video';
            const targetName = isCaller ? outgoing?.targetName : incoming?.callerName;
            setCallConfig({ roomID, isCaller, callType: currentCallType, targetName });
            setOutgoingCall(null);
            setIncomingCall(null);
        };

        const onReject = () => { setOutgoingCall(null); toast.error('Call declined'); };
        const onEnd = () => { setOutgoingCall(null); setIncomingCall(null); setCallConfig(null); toast('Call ended', { icon: '📞' }); };
        const onError = ({ message }) => { setOutgoingCall(null); toast.error(message); };

        socket.on('incoming-call', onIncoming);
        socket.on('call-accepted', onCallAccepted);
        socket.on('reject-call', onReject);
        socket.on('end-call', onEnd);
        socket.on('call-error', onError);

        return () => {
            socket.off('incoming-call', onIncoming);
            socket.off('call-accepted', onCallAccepted);
            socket.off('reject-call', onReject);
            socket.off('end-call', onEnd);
            socket.off('call-error', onError);
        };
    }, [socket, myId]);

    // ── Join socket room ──────────────────────────────────────
    useEffect(() => {
        if (!socket || !room || !nickname) return;
        if (joinedRef.current) return;
        joinedRef.current = true;

        socket.emit('join-room', { roomCode: code, nickname });
        socket.on('room-message', (msg) => setMessages(prev => [...prev, msg]));
        socket.on('room-participants', (p) => setParticipants(p));
        socket.on('user-typing', (data) => { setTyping(data); setTimeout(() => setTyping(null), 2500); });
        socket.on('room-expired', ({ message }) => { toast.error(message); navigate('/dashboard'); });
        socket.on('room-terminated', ({ message }) => { toast.error(message); navigate('/dashboard'); });
        socket.on('room-error', ({ message }) => toast.error(message));
        socket.on('message-reaction-update', ({ messageId, emoji, users }) => {
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, reactions: { ...(m.reactions || {}), [emoji]: users } } : m
            ));
        });
        socket.on('screenshot-detected', ({ nickname: nick }) => {
            toast('📸 ' + (nick || 'Someone') + ' took a screenshot!', { icon: '⚠️', duration: 4000 });
        });

        return () => {
            socket.emit('leave-room', { roomCode: code });
            ['room-message','room-participants','user-typing','room-expired','room-terminated','room-error','message-reaction-update','screenshot-detected']
                .forEach(e => socket.off(e));
            joinedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, room, nickname]);

    // ── Auto-scroll ───────────────────────────────────────────
    useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // ── Countdown timer ───────────────────────────────────────
    useEffect(() => {
        if (!room?.expiresAt) return;
        const tick = () => {
            const diff = new Date(room.expiresAt) - Date.now();
            if (diff <= 0) { setTimeLeft('Expired'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [room]);

    // ── Screenshot detection ──────────────────────────────────
    useScreenshotDetection(useCallback(() => {
        if (socket && code) socket.emit('screenshot-detected', { roomCode: code, nickname: nickname || user?.fullName });
    }, [socket, code, nickname, user]), !!socket && !!code);

    // ── Exit select mode on Escape ────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') {
                setSelectMode(false);
                setSelectedMessages(new Set());
                setReplyTo(null);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    // ── Helpers ───────────────────────────────────────────────
    const isOwn = (senderId) => senderId?.toString() === myId?.toString();
    const isHost = room?.hostUser?._id?.toString() === myId?.toString() || room?.hostUser?.toString() === myId?.toString();
    const formatSize = (b) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;
    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const getDateLabel = (date) => {
        const d = new Date(date);
        const today = new Date();
        const yest = new Date(today); yest.setDate(yest.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yest.toDateString()) return 'Yesterday';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getOtherParticipant = () => participants.find(p => {
        const pid = (p.userId?._id || p.userId)?.toString();
        return pid && pid !== myId?.toString();
    });
    const otherUser = getOtherParticipant();
    const otherName = otherUser?.nickname || otherUser?.fullName || 'User';
    const otherUserId = otherUser?.userId?._id || otherUser?.userId;

    // ── Confirm nickname ──────────────────────────────────────
    const confirmNickname = () => {
        const nick = nickInput.trim() || user?.fullName || 'Anonymous';
        setNickname(nick);
        setShowNickModal(false);
    };

    // ── Send text message ─────────────────────────────────────
    const sendMessage = useCallback(() => {
        if (!input.trim() || !socket) return;
        socket.emit('send-message', {
            roomCode: code,
            text: input.trim(),
            messageType: 'text',
            replyTo: replyTo?._id || null,
        });
        setInput('');
        setReplyTo(null);
    }, [input, socket, code, replyTo]);

    // ── Typing ────────────────────────────────────────────────
    const handleTyping = useCallback(() => {
        if (!socket) return;
        socket.emit('typing', { roomCode: code, nickname: nickname || user?.fullName });
    }, [socket, code, nickname, user]);

    // ── File upload ───────────────────────────────────────────
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toast.error('Max file size is 10MB'); return; }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            let msgType = 'file';
            if (file.type.startsWith('image/')) msgType = 'image';
            else if (file.type === 'application/pdf') msgType = 'pdf';
            else if (file.type.startsWith('video/')) msgType = 'video';
            socket.emit('send-message', { roomCode: code, text: '', messageType: msgType, fileUrl: data.url, fileName: file.name, fileSize: file.size });
            toast.success('File sent!');
        } catch { toast.error('Upload failed'); }
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Voice recording ───────────────────────────────────────
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                stopWaveformAnalysis();
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (blob.size < 1000) { toast.error('Recording too short'); return; }
                setUploading(true);
                try {
                    const formData = new FormData();
                    formData.append('file', blob, `voice-${Date.now()}.webm`);
                    const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    socket.emit('send-message', { roomCode: code, text: '', messageType: 'voice', fileUrl: data.url, fileName: 'Voice message', fileSize: blob.size });
                } catch { toast.error('Voice upload failed'); }
                setUploading(false);
            };
            mediaRecorder.start();
            setRecording(true);
            setRecordingTime(0);
            recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
            startWaveformAnalysis(stream);
        } catch { toast.error('Microphone access denied'); }
    };

    const startWaveformAnalysis = (stream) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            src.connect(analyser);
            waveformCtxRef.current = ctx;
            waveformAnalyserRef.current = analyser;
            const update = () => {
                const data = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(data);
                const bars = Array.from({ length: 24 }, (_, i) => Math.max(8, (data[Math.floor(i * data.length / 24)] / 255) * 100));
                setWaveformBars(bars);
                waveformRafRef.current = requestAnimationFrame(update);
            };
            update();
        } catch { /* ignore */ }
    };

    const stopWaveformAnalysis = () => {
        cancelAnimationFrame(waveformRafRef.current);
        try { waveformCtxRef.current?.close(); } catch { }
        waveformCtxRef.current = null;
        waveformAnalyserRef.current = null;
        setWaveformBars(Array(24).fill(8));
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
            mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
        }
        stopWaveformAnalysis();
        setRecording(false);
        setRecordingTime(0);
        clearInterval(recordTimerRef.current);
    };

    // ── Call helpers ──────────────────────────────────────────
    const startCallTo = (targetUserId, targetName, callType = 'video') => {
        if (!targetUserId || !socket) return;
        socket.emit('call-user', { targetUserId, callerName: nickname || user?.fullName || 'Anonymous', callType });
        setOutgoingCall({ targetUserId, targetName, callType });
    };

    const acceptIncomingCall = () => {
        if (!incomingCall || !socket) return;
        socket.emit('accept-call', { roomID: incomingCall.roomID, callerId: incomingCall.callerId });
    };

    const rejectIncomingCall = () => {
        if (!incomingCall || !socket) return;
        socket.emit('reject-call', { roomID: incomingCall.roomID, callerId: incomingCall.callerId });
        setIncomingCall(null);
    };

    const handleEndCall = () => {
        if (callConfig && socket) {
            socket.emit('end-call', { roomID: callConfig.roomID });
        } else if (outgoingCall && socket) {
            const roomID = [String(myId), String(outgoingCall.targetUserId)].sort().join('_');
            socket.emit('end-call', { roomID });
            setOutgoingCall(null);
        }
        setCallConfig(null);
    };

    // ── Kick user ─────────────────────────────────────────────
    const kickUser = (targetUserId) => {
        if (!socket || !code) return;
        socket.emit('host-kick-user', { roomCode: code, targetUserId });
        toast.success('User kicked from room');
    };

    // ── Leave room ────────────────────────────────────────────
    const leaveRoom = async () => { try { await api.post(`/rooms/${code}/leave`); } catch { } navigate('/dashboard'); };

    // ── Reply actions ─────────────────────────────────────────
    const handleReply = (msg) => {
        setReplyTo(msg);
        setSelectMode(false);
        setSelectedMessages(new Set());
    };

    // ── Multi-select actions ──────────────────────────────────
    const toggleSelectMessage = (msgId) => {
        if (!selectMode) setSelectMode(true);
        setSelectedMessages(prev => {
            const next = new Set(prev);
            if (next.has(msgId)) next.delete(msgId);
            else next.add(msgId);
            return next;
        });
    };

    const handleCopyMessage = (msg) => {
        if (msg.text) navigator.clipboard.writeText(msg.text).then(() => toast.success('Copied!'));
    };

    const handleDeleteMessage = (msg) => {
        // Optimistic removal
        setMessages(prev => prev.filter(m => m._id !== msg._id));
        toast('Message removed', { icon: '🗑️' });
    };

    const handleBulkDelete = () => {
        setMessages(prev => prev.filter(m => !selectedMessages.has(m._id)));
        setSelectMode(false);
        setSelectedMessages(new Set());
        toast(`${selectedMessages.size} message(s) deleted`, { icon: '🗑️' });
    };

    // ── Scroll to replied message ─────────────────────────────
    const scrollToMessage = (msgId) => {
        const el = msgRefs.current[msgId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMsgId(msgId);
            setTimeout(() => setHighlightedMsgId(null), 1800);
        }
    };

    // ── Cleanup on unmount ────────────────────────────────────
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
            clearInterval(recordTimerRef.current);
        };
    }, []);

    /* ═══════════════════════ LOADING SCREEN ═══════════════════════ */
    if (!room) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%',
                alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(160deg, #ede9f6 0%, #f5f0fa 60%, #f0eaf8 100%)',
                fontFamily: "'Inter','Segoe UI',sans-serif",
            }}>
                <div style={{
                    width: 52, height: 52, border: '4px solid rgba(255,255,255,0.15)', borderTopColor: '#fff',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 20,
                }} />
                <p style={{ color: '#fff', fontWeight: 600, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>Loading room…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    /* ═══════════════════════ MAIN RENDER ═══════════════════════ */
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', margin: '0 auto',
            background: '#000000',
            fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
            position: 'relative', overflow: 'hidden',
        }}>

            {/* ── Modals: Nickname ── */}
            {showNickModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                    zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                }}>
                    <div style={{
                        background: '#111', borderRadius: 28, padding: '36px 28px', width: '100%', maxWidth: 380,
                        boxShadow: '0 24px 60px rgba(0,0,0,0.6)', border: '1px solid #27272a', textAlign: 'center',
                        animation: 'popIn 0.25s ease',
                    }}>
                        <div style={{ fontSize: 52, marginBottom: 14 }}>💬</div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Set Your Nickname</h2>
                        <p style={{ color: '#a1a1aa', fontSize: 13, margin: '0 0 22px' }}>This name will appear in the chat</p>
                        <input
                            type="text" value={nickInput} onChange={e => setNickInput(e.target.value)}
                            placeholder={user?.fullName || 'Your nickname'}
                            style={{
                                width: '100%', padding: '13px 18px', borderRadius: 18, border: '1px solid #27272a',
                                outline: 'none', fontSize: 15, background: '#000', color: '#fff',
                                marginBottom: 18, boxSizing: 'border-box', fontFamily: 'inherit',
                                transition: 'border-color 0.2s',
                            }}
                            maxLength={30} autoFocus
                            onKeyDown={e => e.key === 'Enter' && confirmNickname()}
                            onFocus={e => e.target.style.borderColor = '#fff'}
                            onBlur={e => e.target.style.borderColor = '#27272a'}
                        />
                        <button onClick={confirmNickname} style={{
                            width: '100%', padding: '13px 0', borderRadius: 18, border: 'none',
                            background: '#fff', color: '#000',
                            fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'transform 0.15s',
                            fontFamily: 'inherit',
                        }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Join Chat →
                        </button>
                    </div>
                </div>
            )}

            {/* ── Image Lightbox ── */}
            {lightboxImg && (
                <div
                    onClick={() => setLightboxImg(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
                        animation: 'fadeIn 0.2s ease',
                    }}
                >
                    <img src={lightboxImg} alt="Full preview" style={{
                        maxWidth: '92%', maxHeight: '92%', objectFit: 'contain', borderRadius: 16,
                        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                    }} />
                    <button onClick={() => setLightboxImg(null)} style={{
                        position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', fontSize: 20,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                </div>
            )}

            {/* ── WebRTC VideoCall Overlay ── */}
            {callConfig && (
                <VideoCall
                    roomID={callConfig.roomID} isCaller={callConfig.isCaller}
                    callType={callConfig.callType} targetName={callConfig.targetName}
                    socket={socket} onEndCall={handleEndCall}
                />
            )}
            {incomingCall && !callConfig && (
                <IncomingCallNotification
                    callerName={incomingCall.callerName}
                    callType={incomingCall.callType || 'video'}
                    onAccept={acceptIncomingCall}
                    onReject={rejectIncomingCall}
                />
            )}

            {/* ── Outgoing Call Overlay ── */}
            {outgoingCall && !callConfig && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(45,16,105,0.97)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        width: 90, height: 90, borderRadius: '50%',
                        background: '#111', border: '1px solid #333',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 36, color: '#fff', fontWeight: 700, marginBottom: 24,
                        boxShadow: '0 0 0 0 rgba(255,255,255,0.4)',
                        animation: 'ringPulse 1.8s ease-out infinite',
                    }}>
                        {(outgoingCall.targetName || '?')[0]?.toUpperCase()}
                    </div>
                    <h2 style={{ color: '#fff', margin: '0 0 8px', fontSize: 22 }}>Calling {outgoingCall.targetName}…</h2>
                    <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 40 }}>Ringing</p>
                    <button onClick={handleEndCall} style={{
                        width: 64, height: 64, borderRadius: '50%', background: '#ef4444', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 24px rgba(239,68,68,0.5)',
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(135deg)' }}>
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                    </button>
                </div>
            )}

            {/* ── HEADER ── */}
            <ChatHeader
                roomName={room.name}
                otherName={otherName}
                participantCount={participants.length}
                timeLeft={timeLeft}
                otherUserId={otherUserId}
                isHost={isHost}
                participants={participants}
                myId={myId}
                code={code}
                typing={typing}
                onAudioCall={() => {
                    if (!otherUserId) return toast.error('No one else in the room');
                    startCallTo(otherUserId, otherName, 'audio');
                }}
                onVideoCall={() => {
                    if (!otherUserId) return toast.error('No one else in the room');
                    startCallTo(otherUserId, otherName, 'video');
                }}
                onKick={kickUser}
                onLeave={leaveRoom}
            />

            {/* ── Multi-select Action Bar ── */}
            {selectMode && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px', background: '#111', borderBottom: '1px solid #333', color: '#fff',
                    fontFamily: 'inherit', animation: 'slideDown 0.2s ease',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => { setSelectMode(false); setSelectedMessages(new Set()); }}
                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18 }}>✕</button>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{selectedMessages.size} selected</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {selectedMessages.size > 0 && (
                            <button onClick={handleBulkDelete} style={{
                                background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                                padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                            }}>🗑️ Delete</button>
                        )}
                    </div>
                </div>
            )}

            {/* ── MESSAGE LIST ── */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '12px 10px',
                display: 'flex', flexDirection: 'column', gap: 2,
                scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent',
            }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: 80, color: '#888' }}>
                        <div style={{ fontSize: 52, marginBottom: 14 }}>💬</div>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>No messages yet. Say hello! 👋</p>
                    </div>
                )}
                {messages.map((msg, i) => {
                    const own = isOwn(msg.sender);
                    const showDate = i === 0 || getDateLabel(msg.createdAt) !== getDateLabel(messages[i - 1].createdAt);
                    const showSender = !own && (i === 0 || messages[i - 1].sender !== msg.sender);
                    return (
                        <div key={msg._id || i} ref={el => { if (el && msg._id) msgRefs.current[msg._id] = el; }}>
                            <MessageBubble
                                msg={msg}
                                isOwn={own}
                                showSender={showSender}
                                showDate={showDate}
                                dateLabel={getDateLabel(msg.createdAt)}
                                isHighlighted={highlightedMsgId === msg._id}
                                isSelected={selectedMessages.has(msg._id)}
                                selectMode={selectMode}
                                onSelect={toggleSelectMessage}
                                onReply={handleReply}
                                onCopy={handleCopyMessage}
                                onDelete={handleDeleteMessage}
                                onImageClick={setLightboxImg}
                                onReplyClick={scrollToMessage}
                                myId={myId}
                                formatSize={formatSize}
                            />
                        </div>
                    );
                })}
                <div ref={msgEndRef} />
            </div>

            {/* ── INPUT AREA ── */}
            <div style={{ flexShrink: 0 }}>
                {replyTo && (
                    <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} />
                )}
                {recording ? (
                    <RecordingBar
                        recordingTime={recordingTime}
                        waveformBars={waveformBars}
                        onCancel={cancelRecording}
                        onStop={stopRecording}
                    />
                ) : (
                    <InputBar
                        input={input}
                        setInput={setInput}
                        onSend={sendMessage}
                        onTyping={handleTyping}
                        onStartRecording={startRecording}
                        uploading={uploading}
                        fileInputRef={fileInputRef}
                        onFileSelect={handleFileSelect}
                    />
                )}
            </div>

            {/* ── Global Animations ── */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes popIn { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
                @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes slideDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
                @keyframes ringPulse {
                    0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4) }
                    100% { box-shadow: 0 0 0 45px rgba(255,255,255,0) }
                }
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.35); }
            `}</style>
        </div>
    );
}
