import { useRef, useState } from 'react';

export default function ChatHeader({
    roomName, otherName, participantCount, timeLeft,
    otherUserId, isHost, participants, myId, code,
    onAudioCall, onVideoCall, onKick, onLeave,
    typing
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const isTyping = !!typing;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(24px)',
            borderBottom: '1px solid #27272a', position: 'relative', zIndex: 100,
            flexShrink: 0, boxShadow: '0 1px 8px rgba(0,0,0,0.5)',
            fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        }}>
            {/* Avatar */}
            <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: '#111', border: '1px solid #333',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 18,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>
                {(otherName || roomName || 'R')[0]?.toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                    {roomName || otherName || 'Chat Room'}
                </p>
                <p style={{ margin: 0, fontSize: 11.5, color: isTyping ? '#fff' : '#888', lineHeight: 1.2, transition: 'color 0.2s' }}>
                    {isTyping ? (
                        <span style={{ fontStyle: 'italic' }}>✍️ {typing.nickname} is typing...</span>
                    ) : (
                        <>
                            <span style={{ color: '#fff', fontWeight: 600 }}>● </span>
                            {participantCount} member{participantCount !== 1 ? 's' : ''}
                            {' · '}
                            <span style={{ color: timeLeft === 'Expired' ? '#ef4444' : '#fff' }}>⏱ {timeLeft}</span>
                        </>
                    )}
                </p>
            </div>

            {/* Call Buttons */}
            <HeaderIconBtn title="Voice call" onClick={onAudioCall}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.13 12.8 19.79 19.79 0 012.08 4.18 2 2 0 014.05 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
            </HeaderIconBtn>

            <HeaderIconBtn title="Video call" onClick={onVideoCall}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
            </HeaderIconBtn>

            {/* Three-dot Menu */}
            <div ref={menuRef} style={{ position: 'relative' }}>
                <HeaderIconBtn title="More" onClick={() => setMenuOpen(v => !v)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                    </svg>
                </HeaderIconBtn>

                {menuOpen && (
                    <div style={{
                        position: 'absolute', top: 46, right: 0, background: '#111', borderRadius: 16,
                        boxShadow: '0 8px 40px rgba(0,0,0,0.8)', padding: '8px 0', zIndex: 200, minWidth: 190,
                        border: '1px solid #27272a', animation: 'fadeInDown 0.15s ease',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '10px 18px 8px', borderBottom: '1px solid #27272a' }}>
                            <p style={{ fontSize: 10, color: '#888', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Room Code</p>
                            <p style={{ fontSize: 14, color: '#fff', margin: '2px 0 0', fontWeight: 700, fontFamily: 'monospace' }}>{code}</p>
                        </div>
                        <MenuItem onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
                            setMenuOpen(false);
                        }}>📋 Copy Room Link</MenuItem>

                        {isHost && participants.filter(p => (p.userId?._id || p.userId)?.toString() !== myId?.toString()).length > 0 && (
                            <>
                                <div style={{ borderTop: '1px solid #27272a', margin: '4px 0' }} />
                                <p style={{ padding: '6px 18px 4px', fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Kick User</p>
                                {participants
                                    .filter(p => (p.userId?._id || p.userId)?.toString() !== myId?.toString())
                                    .map((p, i) => {
                                        const pid = (p.userId?._id || p.userId)?.toString();
                                        const name = p.nickname || p.fullName || 'User';
                                        return (
                                            <MenuItem key={i} danger onClick={() => { onKick(pid); setMenuOpen(false); }}>🚫 {name}</MenuItem>
                                        );
                                    })}
                            </>
                        )}

                        <div style={{ borderTop: '1px solid #27272a', margin: '4px 0' }} />
                        <MenuItem danger onClick={() => { onLeave(); setMenuOpen(false); }}>🚪 Leave Room</MenuItem>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

function HeaderIconBtn({ children, onClick, title }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            title={title}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: hovered ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: '#fff', transition: 'background 0.15s', flexShrink: 0,
            }}
        >
            {children}
        </button>
    );
}

function MenuItem({ children, onClick, danger }) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, color: danger ? '#ef4444' : '#fff', transition: 'background 0.12s',
                border: 'none', background: hovered ? (danger ? 'rgba(239,68,68,0.15)' : '#1a1a1a') : 'transparent',
                width: '100%', textAlign: 'left', fontFamily: 'inherit',
            }}
        >
            {children}
        </button>
    );
}
