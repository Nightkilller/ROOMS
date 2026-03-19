export default function ReplyPreview({ replyTo, onCancel }) {
    if (!replyTo) return null;

    const preview = replyTo.text
        ? replyTo.text.slice(0, 80) + (replyTo.text.length > 80 ? '...' : '')
        : replyTo.messageType === 'image' ? '📷 Photo'
        : replyTo.messageType === 'voice' ? '🎙️ Voice message'
        : replyTo.messageType === 'video' ? '🎥 Video'
        : '📎 File';

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 16px', background: 'rgba(0,0,0,0.95)',
            borderLeft: '3px solid #ffffff',
            animation: 'slideUp 0.2s ease',
            fontFamily: "'Inter','Segoe UI',sans-serif",
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 11.5, fontWeight: 700, color: '#ffffff' }}>
                    {replyTo.nickname || 'User'}
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {preview}
                </p>
            </div>
            <button
                onClick={onCancel}
                style={{
                    width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.1)', color: '#ffffff', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'background 0.15s',
                }}
            >
                ✕
            </button>
            <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </div>
    );
}
