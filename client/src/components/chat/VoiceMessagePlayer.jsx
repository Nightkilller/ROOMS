import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * VoiceMessagePlayer — WhatsApp-style audio player with play/pause,
 * progress bar, duration display, and waveform visualization.
 */
export default function VoiceMessagePlayer({ src, isOwn = false }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const rafRef = useRef(null);

    // Generate fake waveform bars (consistent per src)
    const bars = useRef(
        Array.from({ length: 28 }, (_, i) => {
            // Simple deterministic "random" based on index
            const h = 20 + ((i * 7 + 13) % 60);
            return h;
        })
    ).current;

    const updateProgress = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || audio.paused) return;
        setCurrentTime(audio.currentTime);
        setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
        rafRef.current = requestAnimationFrame(updateProgress);
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoaded = () => setDuration(audio.duration || 0);
        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
            cancelAnimationFrame(rafRef.current);
        };

        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('ended', onEnded);
        return () => {
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('ended', onEnded);
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            cancelAnimationFrame(rafRef.current);
        } else {
            audio.play().catch(() => {});
            rafRef.current = requestAnimationFrame(updateProgress);
        }
        setIsPlaying(!isPlaying);
    };

    const handleBarClick = (e) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        audio.currentTime = pct * audio.duration;
        setProgress(pct * 100);
        setCurrentTime(audio.currentTime);
    };

    const formatTime = (s) => {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const ownColor = isOwn ? '#000000' : '#ffffff';
    const barBg = isOwn ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
    const barFill = isOwn ? '#000000' : '#ffffff';
    const textColor = isOwn ? 'rgba(0,0,0,0.6)' : '#a1a1aa';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', minWidth: 200 }}>
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause button */}
            <button
                onClick={togglePlay}
                style={{
                    width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: isOwn ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: ownColor, flexShrink: 0, transition: 'background 0.15s',
                }}
            >
                {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>

            {/* Waveform bars */}
            <div
                onClick={handleBarClick}
                style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, height: 32,
                    cursor: 'pointer', position: 'relative',
                }}
            >
                {bars.map((h, i) => {
                    const barPct = ((i + 1) / bars.length) * 100;
                    const isFilled = barPct <= progress;
                    return (
                        <div
                            key={i}
                            style={{
                                width: 3, borderRadius: 2, flexShrink: 0,
                                height: `${h}%`, minHeight: 3,
                                background: isFilled ? barFill : barBg,
                                transition: 'background 0.1s, height 0.2s',
                            }}
                        />
                    );
                })}
            </div>

            {/* Duration */}
            <span style={{ fontSize: 10, color: textColor, fontFamily: 'monospace', flexShrink: 0, minWidth: 32, textAlign: 'right' }}>
                {isPlaying ? formatTime(currentTime) : formatTime(duration)}
            </span>
        </div>
    );
}
