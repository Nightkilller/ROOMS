import { useEffect, useState, useRef } from 'react';

export default function IncomingCallNotification({ callerName, callType = 'video', onAccept, onReject }) {
    const [visible, setVisible] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    // WhatsApp-style ringtone using AudioContext (two-tone ascending ring)
    useEffect(() => {
        let ctx;
        let intervalId;
        let stopped = false;

        const ring = () => {
            if (stopped) return;
            try {
                ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
                if (ctx.state === 'suspended') ctx.resume().catch(() => { });

                // First tone (lower)
                const o1 = ctx.createOscillator();
                const g1 = ctx.createGain();
                o1.type = 'sine';
                o1.frequency.value = 523.25; // C5
                g1.gain.value = 0.0001;
                o1.connect(g1);
                g1.connect(ctx.destination);
                o1.start(ctx.currentTime);
                g1.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.05);
                g1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
                o1.stop(ctx.currentTime + 0.4);
                o1.onended = () => { try { o1.disconnect(); g1.disconnect(); } catch { } };

                // Second tone (higher, slight delay)
                const o2 = ctx.createOscillator();
                const g2 = ctx.createGain();
                o2.type = 'sine';
                o2.frequency.value = 659.25; // E5
                g2.gain.value = 0.0001;
                o2.connect(g2);
                g2.connect(ctx.destination);
                o2.start(ctx.currentTime + 0.15);
                g2.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.2);
                g2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
                o2.stop(ctx.currentTime + 0.6);
                o2.onended = () => { try { o2.disconnect(); g2.disconnect(); } catch { } };

                // Third tone (highest)
                const o3 = ctx.createOscillator();
                const g3 = ctx.createGain();
                o3.type = 'sine';
                o3.frequency.value = 783.99; // G5
                g3.gain.value = 0.0001;
                o3.connect(g3);
                g3.connect(ctx.destination);
                o3.start(ctx.currentTime + 0.3);
                g3.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.35);
                g3.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
                o3.stop(ctx.currentTime + 0.75);
                o3.onended = () => { try { o3.disconnect(); g3.disconnect(); } catch { } };
            } catch { /* ignore */ }
        };

        if (visible) {
            ring();
            intervalId = setInterval(ring, 1800);
        }
        return () => {
            stopped = true;
            clearInterval(intervalId);
            try { ctx?.close(); } catch { }
        };
    }, [visible]);

    const handleReject = () => { setVisible(false); setTimeout(onReject, 200); };
    const handleAccept = () => { setVisible(false); setTimeout(onAccept, 200); };

    const isAudio = callType === 'audio';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 58,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
            opacity: visible ? 1 : 0, transition: 'opacity 0.3s',
        }}>
            <div style={{
                background: 'linear-gradient(180deg, #2d1b69, #1a1040)',
                borderRadius: 32, padding: '40px 32px', width: 320, maxWidth: '90%',
                textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                transform: visible ? 'scale(1)' : 'scale(0.9)', transition: 'transform 0.3s',
            }}>
                {/* Avatar with ringing animation */}
                <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 20px' }}>
                    <div style={{
                        width: 90, height: 90, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7c4dff, #e040fb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 36, fontWeight: 700, color: '#fff', position: 'relative', zIndex: 1,
                    }}>
                        {(callerName || '?')[0]?.toUpperCase()}
                    </div>
                    {/* Pulsating rings */}
                    <div style={{
                        position: 'absolute', inset: -8, borderRadius: '50%',
                        border: '2px solid rgba(124,77,255,0.4)', animation: 'ringPulse 2s ease-out infinite',
                    }} />
                    <div style={{
                        position: 'absolute', inset: -18, borderRadius: '50%',
                        border: '2px solid rgba(124,77,255,0.2)', animation: 'ringPulse 2s ease-out 0.5s infinite',
                    }} />
                    <div style={{
                        position: 'absolute', inset: -28, borderRadius: '50%',
                        border: '2px solid rgba(124,77,255,0.1)', animation: 'ringPulse 2s ease-out 1s infinite',
                    }} />
                </div>

                <p style={{ color: '#fff', fontWeight: 700, fontSize: 20, margin: '0 0 4px' }}>
                    {callerName || 'Unknown'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 32px' }}>
                    {isAudio ? '📞 Incoming voice call...' : '📹 Incoming video call...'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
                    {/* Reject */}
                    <div style={{ textAlign: 'center' }}>
                        <button onClick={handleReject}
                            style={{
                                width: 60, height: 60, borderRadius: '50%',
                                background: '#ef4444', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 20px rgba(239,68,68,0.4)', transition: 'transform 0.15s',
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(135deg)' }}>
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                            </svg>
                        </button>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 8 }}>Decline</p>
                    </div>
                    {/* Accept */}
                    <div style={{ textAlign: 'center' }}>
                        <button onClick={handleAccept}
                            style={{
                                width: 60, height: 60, borderRadius: '50%',
                                background: '#22c55e', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 20px rgba(34,197,94,0.4)', transition: 'transform 0.15s',
                                animation: 'gentlePulse 2s ease-in-out infinite',
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                            </svg>
                        </button>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 8 }}>Accept</p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes ringPulse {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes gentlePulse {
                    0%, 100% { box-shadow: 0 4px 20px rgba(34,197,94,0.4); }
                    50% { box-shadow: 0 4px 30px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.2); }
                }
            `}</style>
        </div>
    );
}
