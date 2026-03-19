import React, { useEffect, useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useAuth } from '../../context/AuthContext';

export default function VideoCall({ roomID, isCaller, callType, targetName, socket, onEndCall }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // Listen for remote hangup
    useEffect(() => {
        if (!socket) return;
        const handleEnd = () => {
            console.log('[Jitsi] Remote user ended the call');
            onEndCall();
        };
        socket.on('end-call', handleEnd);
        return () => socket.off('end-call', handleEnd);
    }, [socket, onEndCall]);

    // Handle local hangup (Triggered by custom button OR Jitsi API)
    const handleLocalHangup = () => {
        console.log('[Jitsi] Hanging up local call...');
        if (socket && roomID) {
            socket.emit('end-call', { roomID });
        }
        onEndCall();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: '#0d0d14' }}>
            
            {/* Custom Overlay Header */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 76,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)',
                zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 24px', pointerEvents: 'none'
            }}>
                <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ 
                        width: 42, height: 42, borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #7c4dff, #e040fb)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#fff', fontSize: 20, fontWeight: 'bold' 
                    }}>
                        {(targetName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                        <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {targetName || 'User'}
                        </p>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: 13, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {callType === 'audio' ? 'Secure Audio Call' : 'Secure Video Call'}
                        </p>
                    </div>
                </div>

                <button 
                    onClick={handleLocalHangup}
                    style={{
                        pointerEvents: 'auto', background: '#ef4444', color: '#fff',
                        border: 'none', padding: '10px 24px', borderRadius: 12,
                        fontWeight: 'bold', fontSize: 14, cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                        transition: 'transform 0.1s'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    End Call
                </button>
            </div>

            {/* Loading Spinner underneath while iframe mounts */}
            {loading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 50 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                        <div style={{ 
                            width: 50, height: 50, border: '4px solid rgba(255,255,255,0.1)', 
                            borderTopColor: '#7c4dff', borderRadius: '50%', 
                            animation: 'spin 0.8s linear infinite' 
                        }} />
                        <p style={{ fontSize: 17, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                            Connecting Securely...
                        </p>
                    </div>
                </div>
            )}

            {/* Jitsi Meet Embed */}
            <JitsiMeeting
                domain="meet.jit.si"
                roomName={`ROOMS_EncryptedCall_${roomID}`}
                configOverwrite={{
                    startWithAudioMuted: false,
                    startWithVideoMuted: callType === 'audio',
                    prejoinPageEnabled: false, // Skip annoying "enter your name" page!
                    disableDeepLinking: true,  // Don't show "Download the App" prompt!
                    toolbarButtons: [
                        'microphone', 'camera', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'chat', 'settings',
                        'videoquality', 'tileview'
                    ],
                }}
                interfaceConfigOverwrite={{
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_BRAND_WATERMARK: false,
                    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                    DEFAULT_BACKGROUND: '#0d0d14',
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
                }}
                userInfo={{
                    displayName: user?.fullName || 'Participant'
                }}
                onApiReady={(externalApi) => {
                    setLoading(false);
                    console.log('[Jitsi] API Ready');
                    
                    // When user clicks the red Hangup button inside Jitsi itself
                    externalApi.addListener('videoConferenceLeft', () => {
                        console.log('[Jitsi] User clicked hangup icon');
                        handleLocalHangup();
                    });
                }}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                    iframeRef.style.border = 'none';
                    iframeRef.style.background = '#0d0d14';
                }}
            />

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
