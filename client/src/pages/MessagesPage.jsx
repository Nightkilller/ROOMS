import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import VideoCall from '../components/chat/VideoCall';
import IncomingCallNotification from '../components/chat/IncomingCallNotification';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function MessagesPage() {
    const { user } = useAuth();
    const socket = useSocket();
    const { activeChat, setActiveChat, joinChatRoom } = useChat();
    const myId = user?.id || user?._id;

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [callConfig, setCallConfig] = useState(null); // { roomID, token, appId, userId, userName, callType }
    const [incomingCall, setIncomingCall] = useState(null); // { roomID, callerId, callerName, callType }
    const [outgoingCall, setOutgoingCall] = useState(null); // { targetUserId, targetName, callType }

    // ── Handle incoming calls ────────────────────────────────
    useEffect(() => {
        if (!socket || !myId) return;

        const onIncoming = ({ roomID, callerId, callerName, callType }) => {
            setIncomingCall({ roomID, callerId, callerName, callType });
        };

        const onAccept = async ({ roomID }) => {
            try {
                const { data } = await api.get('/chat/call-token');
                setCallConfig({
                    roomID,
                    token: data.token,
                    appId: data.appId,
                    userId: String(data.userId),
                    userName: data.userName,
                    callType: outgoingCall?.callType || incomingCall?.callType || 'video',
                });
                setOutgoingCall(null);
                setIncomingCall(null);
            } catch (err) {
                toast.error('Failed to connect call secure token');
                setOutgoingCall(null);
                setIncomingCall(null);
            }
        };

        const onReject = () => {
            setOutgoingCall(null);
            toast.error('Call declined');
        };

        const onEnd = () => {
            setOutgoingCall(null);
            setIncomingCall(null);
            setCallConfig(null);
            toast('Call ended', { icon: '📞' });
        };
        
        const onError = ({ message }) => {
            setOutgoingCall(null);
            toast.error(message);
        };

        socket.on('incoming-call', onIncoming);
        socket.on('accept-call', onAccept);
        socket.on('reject-call', onReject);
        socket.on('end-call', onEnd);
        socket.on('call-error', onError);

        return () => { 
            socket.off('incoming-call', onIncoming); 
            socket.off('accept-call', onAccept);
            socket.off('reject-call', onReject);
            socket.off('end-call', onEnd);
            socket.off('call-error', onError);
        };
    }, [socket, myId, outgoingCall, incomingCall]);

    // ── Select a chat ────────────────────────────────────────
    const handleSelectChat = (chat) => {
        setActiveChat(chat);
        joinChatRoom(chat._id);
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    // ── Start a call (video or audio) ──────────────────────────
    const handleStartCall = (targetUserId, targetName, callType = 'video') => {
        if (!targetUserId || !socket) return;
        socket.emit('call-user', { targetUserId, callerName: user?.fullName || 'Anonymous', callType });
        setOutgoingCall({ targetUserId, targetName, callType });
    };

    // ── Accept incoming call ─────────────────────────────────
    const handleAcceptCall = () => {
        if (!incomingCall || !socket) return;
        socket.emit('accept-call', { roomID: incomingCall.roomID, callerId: incomingCall.callerId });
    };

    // ── Reject incoming call ─────────────────────────────────
    const handleRejectCall = () => {
        if (!incomingCall || !socket) return;
        socket.emit('reject-call', { roomID: incomingCall.roomID, callerId: incomingCall.callerId });
        setIncomingCall(null);
    };

    const handleEndCall = () => {
        if (callConfig && socket) {
            socket.emit('end-call', { roomID: callConfig.roomID });
        } else if (outgoingCall && socket) {
            const roomID = [String(myId), String(outgoingCall.targetUserId)].sort().join('_');
            socket.emit('end-call', { roomID, targetUserId: outgoingCall.targetUserId });
            setOutgoingCall(null);
        }
        setCallConfig(null);
    };

    return (
        <div className="h-screen flex flex-col bg-dark-900 overflow-hidden">
            <Navbar />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar toggle (mobile) */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden fixed bottom-4 left-4 z-40 w-12 h-12 rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 flex items-center justify-center"
                >
                    💬
                </button>

                {/* Sidebar */}
                <div className={`
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0 fixed lg:relative z-30
                    w-80 lg:w-80 h-full transition-transform duration-200 shrink-0
                `}>
                    <ChatSidebar onSelectChat={handleSelectChat} />
                </div>

                {/* Mobile sidebar backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Chat Window */}
                <ChatWindow chat={activeChat} onStartCall={handleStartCall} />
            </div>

            {/* Video Call Modal (ZEGOCLOUD) */}
            {callConfig && (
                <VideoCall
                    roomID={callConfig.roomID}
                    token={callConfig.token}
                    appId={callConfig.appId}
                    userId={callConfig.userId}
                    userName={callConfig.userName}
                    callType={callConfig.callType}
                    onEndCall={handleEndCall}
                />
            )}

            {/* Incoming Call Notification */}
            {incomingCall && !callConfig && (
                <IncomingCallNotification
                    callerName={incomingCall.callerName}
                    callType={incomingCall.callType || 'video'}
                    onAccept={handleAcceptCall}
                    onReject={handleRejectCall}
                />
            )}
            
            {/* Outgoing Call Ringing Overlay */}
            {outgoingCall && !callConfig && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
                    zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                    flexDirection: 'column'
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #7c4dff, #e040fb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32,
                        marginBottom: 20, animation: 'ringPulse 2s infinite'
                    }}>
                        {(outgoingCall.targetName || '?')[0]?.toUpperCase()}
                    </div>
                    <h2 style={{ color: '#fff', margin: '0 0 8px' }}>Calling {outgoingCall.targetName}...</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 30 }}>Ringing</p>
                    <button onClick={handleEndCall} style={{
                        width: 60, height: 60, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                    }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(135deg)' }}>
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                    </button>
                    <style>{`@keyframes ringPulse { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4) } 100% { box-shadow: 0 0 0 40px rgba(255,255,255,0) } }`}</style>
                </div>
            )}
        </div>
    );
}
