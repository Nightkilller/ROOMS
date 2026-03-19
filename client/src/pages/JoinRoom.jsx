import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function JoinRoom() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleJoin = async (e) => {
        e.preventDefault();
        if (code.trim().length < 4) { toast.error('Please enter a valid room code'); return; }
        setLoading(true);
        try {
            await api.post('/rooms/join', { code: code.trim().toUpperCase() });
            toast.success('Joined room!');
            navigate(`/room/${code.trim().toUpperCase()}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Room not found or expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleInput = e => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        setCode(val);
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0f1012' }}>
            <Navbar />
            <main className="max-w-xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full flex flex-col justify-center">
                <div className="animate-fade-in">
                    <div className="rounded-2xl border-2 p-8" style={{ backgroundColor: '#1b1d21', borderColor: '#27272a' }}>
                        <div className="text-center mb-8">
                            <div className="text-5xl mb-4">🔗</div>
                            <h1 className="text-2xl font-bold mb-1" style={{ color: '#f4f4f5' }}>Join a Room</h1>
                            <p className="text-sm" style={{ color: '#71717a' }}>Enter a code to access a secure channel</p>
                        </div>
                        <form onSubmit={handleJoin} className="space-y-5">
                            <input
                                type="text"
                                value={code}
                                onChange={handleInput}
                                placeholder="XXXXXXXX"
                                maxLength={8}
                                autoFocus
                                className="w-full px-4 py-5 rounded-xl text-center text-3xl sm:text-4xl font-mono font-bold tracking-[0.3em] uppercase outline-none border-2 transition-all duration-200"
                                style={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#F0A026' }}
                                onFocus={e => { e.target.style.borderColor = '#F0A026'; e.target.style.boxShadow = '0 0 0 3px rgba(240,160,38,0.12)'; }}
                                onBlur={e => { e.target.style.borderColor = '#3f3f46'; e.target.style.boxShadow = 'none'; }}
                            />
                            <button type="submit" disabled={loading || code.length < 4}
                                className="w-full py-3 rounded-xl font-bold text-sm text-[#1b1d21] active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ backgroundColor: '#F0A026' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#ffc94a'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#F0A026'}
                            >
                                {loading ? 'Joining…' : 'Join Room'}
                            </button>
                        </form>
                        <p className="text-center text-xs mt-5" style={{ color: '#52525b' }}>
                            Ask the room creator for the unique access code
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
