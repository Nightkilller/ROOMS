export default function RecordingBar({ recordingTime, waveformBars, onCancel, onStop }) {
    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid #27272a', flexShrink: 0,
            fontFamily: "'Inter','Segoe UI',sans-serif",
        }}>
            {/* Cancel */}
            <button
                onClick={onCancel}
                style={{
                    width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'background 0.15s',
                }}
            >
                🗑️
            </button>

            {/* Waveform + timer */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                background: '#1a1a1a', borderRadius: 24, padding: '8px 14px',
            }}>
                <span style={{
                    width: 10, height: 10, borderRadius: '50%', background: '#ef4444',
                    flexShrink: 0, animation: 'recPulse 1s ease-in-out infinite',
                }} />
                <span style={{ fontSize: 13.5, color: '#ef4444', fontFamily: 'monospace', fontWeight: 700, flexShrink: 0, minWidth: 36 }}>
                    {formatTime(recordingTime)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, height: 30 }}>
                    {waveformBars.map((h, i) => (
                        <div key={i} style={{
                            width: 3, borderRadius: 2, flexShrink: 0,
                            height: `${Math.max(8, h)}%`, minHeight: 3,
                            background: `rgba(255,255,255, ${0.4 + (h / 100) * 0.6})`,
                            transition: 'height 0.07s ease',
                        }} />
                    ))}
                </div>
            </div>

            {/* Send */}
            <button
                onClick={onStop}
                style={{
                    width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: '#ffffff', color: '#000000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: '0 3px 12px rgba(255,255,255,0.2)',
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
                </svg>
            </button>

            <style>{`
                @keyframes recPulse {
                    0%,100% { opacity:1; transform:scale(1); }
                    50% { opacity:0.4; transform:scale(0.75); }
                }
            `}</style>
        </div>
    );
}
