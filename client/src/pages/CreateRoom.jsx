import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import toast from 'react-hot-toast';

const DURATIONS = [
    { label: '10 minutes', value: '10m' },
    { label: '30 minutes', value: '30m' },
    { label: '1 hour', value: '1h' },
    { label: '6 hours', value: '6h' },
    { label: '24 hours', value: '24h' },
];

const inputStyle = { backgroundColor: '#000000', borderColor: '#27272a' };
const focusInput = e => { e.target.style.borderColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 1px #ffffff'; };
const blurInput = e => { e.target.style.borderColor = '#27272a'; e.target.style.boxShadow = 'none'; };

// The Resend "White Curve Handle" Corner Component
const CornerHandles = () => (
    <>
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-white rounded-tl-2xl pointer-events-none z-10" />
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-white rounded-tr-2xl pointer-events-none z-10" />
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-white rounded-bl-2xl pointer-events-none z-10" />
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-white rounded-br-2xl pointer-events-none z-10" />
    </>
);

export default function CreateRoom() {
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('1h');   // default: 1h string key
    const [loading, setLoading] = useState(false);
    const [room, setRoom] = useState(null);
    const navigate = useNavigate();

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/rooms/create', { name, duration });
            setRoom(data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(`${window.location.origin}/room/${room.roomCode}`).catch(() => { });
        toast.success('Room link copied!');
    };
    const shareCode = () => {
        if (navigator.share) navigator.share({ title: 'Join my ROOMS chat', text: `Code: ${room.roomCode}`, url: `${window.location.origin}/room/${room.roomCode}` }).catch(() => { });
        else copyCode();
    };

    return (
        <div className="min-h-screen flex flex-col bg-black text-white selection:bg-white/30 selection:text-white">
            <Navbar />
            <main className="max-w-[440px] mx-auto px-4 sm:px-6 py-12 flex-1 w-full flex flex-col justify-center relative">
                
                {/* Background Ambient Glow (Optional Resend-like effect) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

                <div className="animate-fade-in relative z-10 w-full mb-16">
                    {!room ? (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-[28px] tracking-tight font-semibold text-white mb-2">Create a Room</h1>
                                <p className="text-[#888888] text-[15px]">Start an encrypted, ephemeral chat</p>
                            </div>
                            
                            <div className="relative rounded-2xl p-6 sm:p-8 bg-[#000000] border border-[#27272a] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_0_40px_rgba(0,0,0,0.8)]">
                                <CornerHandles />
                                
                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div className="space-y-2.5">
                                        <label className="block text-[13px] font-medium text-[#888888] tracking-wide">
                                            ROOM NAME <span className="text-[#444444] font-normal">(OPTIONAL)</span>
                                        </label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                                            placeholder="e.g. Team Sync" maxLength={60}
                                            className="w-full px-3.5 py-3 rounded-xl text-white placeholder-[#444444] outline-none border transition-all duration-200 text-[15px]"
                                            style={inputStyle} onFocus={focusInput} onBlur={blurInput}
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="block text-[13px] font-medium text-[#888888] tracking-wide">
                                            SELF-DESTRUCT TIMER
                                        </label>
                                        <select value={duration} onChange={e => setDuration(e.target.value)}
                                            className="w-full px-3.5 py-3 rounded-xl text-white outline-none border transition-all duration-200 text-[15px] appearance-none cursor-pointer"
                                            style={inputStyle} onFocus={focusInput} onBlur={blurInput}
                                        >
                                            {DURATIONS.map(d => <option key={d.value} value={d.value} className="bg-[#111111]">{d.label}</option>)}
                                        </select>
                                    </div>
                                    <button type="submit" disabled={loading}
                                        className="w-full mt-2 py-3.5 rounded-xl font-medium text-[15px] text-black bg-white active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e5e5e5]"
                                    >
                                        {loading ? 'Creating…' : 'Create Room'}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-[28px] tracking-tight font-semibold text-white mb-2">Room Ready!</h1>
                                <p className="text-[#888888] text-[15px]">{room.name || 'Your private room is live'}</p>
                            </div>
                            
                            <div className="relative rounded-2xl p-6 sm:p-8 bg-[#000000] border border-[#27272a] shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_0_40px_rgba(0,0,0,0.8)] text-center">
                                <CornerHandles />

                                <div className="rounded-xl p-6 mb-6 cursor-pointer border border-[#27272a] bg-[#0a0a0a] hover:bg-[#111111] transition-all duration-200 group"
                                    onClick={copyCode}
                                >
                                    <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-[#666666]">Room Code</p>
                                    <div className="text-[40px] sm:text-5xl font-mono font-medium tracking-[0.15em] text-white group-hover:text-[#e0e0e0] transition-colors">{room.roomCode}</div>
                                    <p className="text-[13px] mt-4 text-[#888888] group-hover:text-[#aaaaaa] transition-colors flex items-center justify-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                        Click to copy link
                                    </p>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                    <button onClick={copyCode} className="flex-1 py-3 rounded-xl text-[14px] font-medium border border-[#27272a] text-[#a1a1aa] bg-transparent hover:text-white hover:border-[#444444] transition-all duration-200">
                                        Copy Link
                                    </button>
                                    <button onClick={shareCode} className="flex-1 py-3 rounded-xl text-[14px] font-medium border border-[#27272a] text-[#a1a1aa] bg-transparent hover:text-white hover:border-[#444444] transition-all duration-200">
                                        Share Link
                                    </button>
                                </div>
                                <button onClick={() => navigate(`/room/${room.roomCode}`)}
                                    className="w-full py-3.5 rounded-xl font-medium text-[15px] text-black bg-white active:scale-[0.98] transition-all duration-200 hover:bg-[#e5e5e5]"
                                >
                                    Enter Room
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
