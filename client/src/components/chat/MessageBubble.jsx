import { useState, useRef, useEffect } from 'react';
import VoiceMessagePlayer from './VoiceMessagePlayer';

const LONG_PRESS_DURATION = 500;

export default function MessageBubble({
    msg, isOwn, showSender, showDate, dateLabel, isHighlighted,
    isSelected, selectMode, onSelect, onReply, onCopy, onDelete,
    onImageClick, onReplyClick, myId, formatSize
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const longPressTimer = useRef(null);
    const bubbleRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
        return () => clearTimeout(longPressTimer.current);
    }, []);

    // Close menu on outside click
    useEffect(() => {
        if (!showMenu) return;
        const close = () => setShowMenu(false);
        document.addEventListener('mousedown', close, { once: true });
        return () => document.removeEventListener('mousedown', close);
    }, [showMenu]);

    const openMenu = (clientX, clientY) => {
        setMenuPos({ x: clientX, y: clientY });
        setShowMenu(true);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY);
    };

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        longPressTimer.current = setTimeout(() => {
            if (selectMode) {
                onSelect(msg._id);
            } else {
                openMenu(touch.clientX, touch.clientY);
            }
        }, LONG_PRESS_DURATION);
    };

    const handleTouchEnd = () => clearTimeout(longPressTimer.current);

    const handleClick = () => {
        if (selectMode) onSelect(msg._id);
    };

    const sentGrad = '#ffffff';
    const sentShadow = '0 2px 12px rgba(255,255,255,0.1)';
    const recvBg = '#111111';
    const recvShadow = '0 1px 6px rgba(0,0,0,0.5)';

    const replyPreviewData = msg.replyTo;

    return (
        <>
            {showDate && (
                <div style={{
                    alignSelf: 'center', padding: '4px 14px', borderRadius: 20,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
                    fontSize: 11, color: '#a1a1aa', fontWeight: 600, margin: '8px 0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.5)', letterSpacing: 0.3,
                }}>
                    {dateLabel}
                </div>
            )}

            <div
                ref={bubbleRef}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                style={{
                    display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end', gap: 8, marginBottom: 3,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.22s ease, transform 0.22s ease',
                    cursor: selectMode ? 'pointer' : 'default',
                    paddingLeft: isOwn ? 0 : 4,
                }}
            >
                {/* Selection checkbox */}
                {selectMode && (
                    <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? '#fff' : '#444'}`,
                        background: isSelected ? '#fff' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s', alignSelf: 'center',
                        order: isOwn ? 2 : -1,
                    }}>
                        {isSelected && <span style={{ color: '#000', fontSize: 12 }}>✓</span>}
                    </div>
                )}

                {/* Other user avatar */}
                {!isOwn && (
                    <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: '#222', border: '1px solid #333',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 12, marginBottom: 4,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    }}>
                        {(msg.nickname || '?')[0]?.toUpperCase()}
                    </div>
                )}

                {/* Bubble */}
                <div style={{ maxWidth: 'min(72%, 380px)', position: 'relative' }}>
                    {showSender && !isOwn && (
                        <p style={{ margin: '0 0 3px 4px', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa' }}>
                            {msg.nickname || 'Anonymous'}
                        </p>
                    )}

                    <div
                        style={{
                            padding: msg.messageType === 'image' || msg.messageType === 'video' ? 4 : '9px 13px',
                            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isOwn ? sentGrad : recvBg,
                            color: isOwn ? '#000000' : '#ffffff',
                            boxShadow: isOwn ? sentShadow : recvShadow,
                            wordBreak: 'break-word', lineHeight: 1.45, position: 'relative', overflow: 'hidden',
                            outline: isHighlighted ? '2px solid #ffffff' : 'none',
                            transition: 'outline 0.3s',
                            userSelect: selectMode ? 'none' : 'auto',
                            border: isOwn ? '1px solid #ffffff' : '1px solid #27272a',
                        }}
                    >
                        {/* Reply Preview inside bubble */}
                        {replyPreviewData && (
                            <div
                                onClick={(e) => { e.stopPropagation(); onReplyClick?.(replyPreviewData._id); }}
                                style={{
                                    marginBottom: 6, padding: '6px 10px',
                                    borderLeft: '3px solid ' + (isOwn ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'),
                                    background: isOwn ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                                    borderRadius: '4px 8px 8px 4px', cursor: 'pointer',
                                }}
                            >
                                <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: isOwn ? 'rgba(0,0,0,0.85)' : '#ffffff' }}>
                                    {replyPreviewData.nickname || 'User'}
                                </p>
                                <p style={{ margin: 0, fontSize: 12, color: isOwn ? 'rgba(0,0,0,0.6)' : '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {replyPreviewData.text || (replyPreviewData.messageType === 'image' ? '📷 Photo' : replyPreviewData.messageType === 'voice' ? '🎙️ Voice' : '📎 File')}
                                </p>
                            </div>
                        )}

                        {/* Content */}
                        {msg.messageType === 'image' && msg.fileUrl && (
                            <img
                                src={msg.fileUrl} alt={msg.fileName}
                                onClick={() => onImageClick(msg.fileUrl)}
                                style={{ maxWidth: 240, maxHeight: 280, borderRadius: 14, display: 'block', cursor: 'zoom-in', objectFit: 'cover' }}
                            />
                        )}
                        {msg.messageType === 'video' && msg.fileUrl && (
                            <video src={msg.fileUrl} controls style={{ maxWidth: 260, borderRadius: 14, display: 'block' }} />
                        )}
                        {msg.messageType === 'voice' && msg.fileUrl && (
                            <div style={{ padding: '5px 6px 2px' }}>
                                <VoiceMessagePlayer src={msg.fileUrl} isOwn={isOwn} />
                            </div>
                        )}
                        {(msg.messageType === 'pdf' || msg.messageType === 'file') && msg.fileUrl && (
                            <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                                borderRadius: 10, textDecoration: 'none',
                                background: isOwn ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                                color: isOwn ? '#000' : '#fff',
                            }}>
                                <span style={{ fontSize: 22, flexShrink: 0 }}>{msg.messageType === 'pdf' ? '📄' : '📎'}</span>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{msg.fileName}</p>
                                    {msg.fileSize > 0 && <p style={{ fontSize: 10, opacity: 0.6, margin: 0 }}>{formatSize(msg.fileSize)}</p>}
                                </div>
                            </a>
                        )}
                        {msg.text && (
                            <p style={{ fontSize: 14, margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{msg.text}</p>
                        )}

                        {/* Timestamp + ticks */}
                        <div style={{
                            fontSize: 10, marginTop: 4, textAlign: 'right',
                            color: isOwn ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)',
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
                        }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isOwn && (
                                <svg width="15" height="11" viewBox="0 0 15 11" fill="none" style={{ opacity: 0.85 }}>
                                    <path d="M1 5.5L4.5 9L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M6 5.5L9.5 9L14 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Emoji reactions */}
                    {msg.reactions && Object.entries(msg.reactions).some(([, u]) => u?.length > 0) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4, justifyContent: isOwn ? 'flex-end' : 'flex-start', paddingLeft: 4 }}>
                            {Object.entries(msg.reactions).map(([emoji, users]) =>
                                Array.isArray(users) && users.length > 0 && (
                                    <span key={emoji} style={{
                                        fontSize: 11, background: isOwn ? 'rgba(0,0,0,0.06)' : '#222', border: isOwn ? '1px solid rgba(0,0,0,0.1)' : '1px solid #333',
                                        borderRadius: 20, padding: '2px 7px', cursor: 'default',
                                    }}>
                                        {emoji} {users.length}
                                    </span>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Context Menu */}
            {showMenu && (
                <ContextMenu
                    x={menuPos.x} y={menuPos.y}
                    isOwn={isOwn}
                    onReply={() => { setShowMenu(false); onReply(msg); }}
                    onCopy={() => { setShowMenu(false); onCopy(msg); }}
                    onDelete={() => { setShowMenu(false); onDelete(msg); }}
                    onSelect={() => { setShowMenu(false); onSelect(msg._id); }}
                    isText={!!msg.text}
                />
            )}
        </>
    );
}

function ContextMenu({ x, y, onReply, onCopy, onDelete, onSelect, isOwn, isText }) {
    const menuRef = useRef(null);
    const [pos, setPos] = useState({ left: x, top: y });

    useEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;
        const rect = menu.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let left = x;
        let top = y;
        if (left + rect.width > vw - 8) left = vw - rect.width - 8;
        if (top + rect.height > vh - 8) top = vh - rect.height - 8;
        if (left < 8) left = 8;
        if (top < 8) top = 8;
        setPos({ left, top });
    }, [x, y]);

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed', left: pos.left, top: pos.top,
                background: '#111', borderRadius: 14, padding: '6px 0',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)', zIndex: 9000,
                minWidth: 160, fontFamily: "'Inter','Segoe UI',sans-serif",
                border: '1px solid #333',
                animation: 'popIn 0.12s ease',
            }}
            onMouseDown={e => e.stopPropagation()}
        >
            <CtxItem icon="↩️" label="Reply" onClick={onReply} />
            {isText && <CtxItem icon="📋" label="Copy" onClick={onCopy} />}
            <CtxItem icon="✅" label="Select" onClick={onSelect} />
            {isOwn && <CtxItem icon="🗑️" label="Delete" onClick={onDelete} danger />}
            <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }`}</style>
        </div>
    );
}

function CtxItem({ icon, label, onClick, danger }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                border: 'none', background: hov ? (danger ? 'rgba(239,68,68,0.15)' : '#272727') : 'transparent',
                width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13.5, fontWeight: 500, color: danger ? '#ef4444' : '#ffffff',
                transition: 'background 0.12s',
            }}
        >
            <span style={{ fontSize: 15 }}>{icon}</span> {label}
        </button>
    );
}
