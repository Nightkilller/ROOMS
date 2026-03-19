import { useRef, useState } from 'react';

export default function InputBar({ input, setInput, onSend, onTyping, onStartRecording, uploading, fileInputRef, onFileSelect }) {

    const [focused, setFocused] = useState(false);
    const hasText = input.trim().length > 0;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid #27272a',
            flexShrink: 0, fontFamily: "'Inter','Segoe UI',sans-serif",
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
                paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
            }}>
                {/* Emoji icon (placeholder) */}
                <IconBtn title="Emoji">
                    <span style={{ fontSize: 21 }}>😊</span>
                </IconBtn>

                {/* Attachment */}
                <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={onFileSelect}
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                />
                <IconBtn title="Attach file" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? (
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite', stroke: '#fff' }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="30 70" />
                        </svg>
                    ) : (
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#888' }}>
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                        </svg>
                    )}
                </IconBtn>

                {/* Text input */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={e => { setInput(e.target.value); onTyping(); }}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Message…"
                        maxLength={2000}
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '10px 16px', borderRadius: 24,
                            border: `1.5px solid ${focused ? '#fff' : 'transparent'}`,
                            outline: 'none', fontSize: 14.5, background: '#111', color: '#fff',
                            transition: 'border-color 0.2s', fontFamily: 'inherit', lineHeight: 1.4,
                        }}
                    />
                </div>

                {/* Mic or Send */}
                {hasText ? (
                    <SendButton onClick={onSend} />
                ) : (
                    <IconBtn title="Record voice" onClick={onStartRecording}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#888' }}>
                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
                        </svg>
                    </IconBtn>
                )}
            </div>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes sendPop { 0%{transform:scale(0.85)} 60%{transform:scale(1.08)} 100%{transform:scale(1)} }
            `}</style>
        </div>
    );
}

function IconBtn({ children, onClick, title, disabled }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: hov ? 'rgba(255,255,255,0.1)' : 'transparent',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1, transition: 'background 0.15s',
            }}
        >
            {children}
        </button>
    );
}

function SendButton({ onClick }) {
    const [pressed, setPressed] = useState(false);
    return (
        <button
            onClick={() => { setPressed(true); onClick(); setTimeout(() => setPressed(false), 300); }}
            style={{
                width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: '#fff',
                color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 3px 12px rgba(255,255,255,0.2)',
                animation: pressed ? 'sendPop 0.3s ease' : 'none',
                transition: 'box-shadow 0.2s',
            }}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
            </svg>
        </button>
    );
}
