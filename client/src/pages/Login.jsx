import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import api from '../api/axios';
import toast from 'react-hot-toast';

const BG_IMAGES = [
    '/login-bg/bg1.png',
    '/login-bg/bg2.png',
    '/login-bg/bg3.png',
    '/login-bg/bg4.png',
    '/login-bg/bg5.png',
];


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [guestMode, setGuestMode] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestLoading, setGuestLoading] = useState(false);
    const { setUserFromToken, guestLogin } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();

    // Pick a random background once per visit (not on every re-render)
    const bgImage = useMemo(
        () => BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)],
        []
    );

    if (params.get('error')) toast.error('OAuth login failed');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            
            if (!userCred.user.emailVerified) {
                toast.error("Please verify your email address first. Check your inbox for the link!");
                setLoading(false);
                return;
            }
            
            // Securely handshake with our Node.js Backend to establish the session JWT
            const idToken = await userCred.user.getIdToken();
            const response = await api.post('/auth/firebase-login', { idToken });
            
            setUserFromToken(response.data.accessToken, response.data.user);
            
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            console.error('Firebase Login Error:', err);
            if (err.code === 'auth/invalid-credential') {
                toast.error('Invalid email or password.');
            } else {
                toast.error(err.message || 'Login failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        if (!guestName.trim()) { toast.error('Please enter your name'); return; }
        setGuestLoading(true);
        try {
            await guestLogin(guestName.trim());
            toast.success('Welcome, ' + guestName.trim() + '!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Guest login failed');
        } finally {
            setGuestLoading(false);
        }
    };

    const API = import.meta.env.VITE_API_URL || '';

    return (
        <div className="min-h-screen bg-[#0f1012] flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] animate-fade-in"
                style={{ minHeight: 560 }}>

                {/* ── Left Panel: Random AI Background ── */}
                <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-8 overflow-hidden"
                    style={{
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}>
                    {/* Gloss overlay for the "oily" sheen */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%, rgba(240,160,38,0.08) 100%)'
                        }} />

                    {/* Logo top-left — big brand mark */}
                    <div className="relative z-10">
                        <div className="flex flex-col gap-1">
                            <span className="text-[#F0A026] font-black" style={{ fontSize: '4.5rem', lineHeight: 1, textShadow: '0 0 40px rgba(240,160,38,0.5)' }}>◈</span>
                            <span className="text-white font-black tracking-[0.35em] uppercase" style={{ fontSize: '1.6rem', letterSpacing: '0.35em', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>ROOMS</span>
                        </div>
                    </div>

                    {/* Tagline bottom-left */}
                    <div className="relative z-10">
                        <p className="text-white text-4xl font-light leading-tight">
                            Be a Part of<br />
                            Something <span className="font-extrabold">Beautiful</span>
                        </p>
                    </div>
                </div>

                {/* ── Right Panel: Dark Form ── */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12"
                    style={{ backgroundColor: '#1b1d21' }}>
                    <div className="w-full max-w-xs">
                        {/* Mobile-only logo */}
                        <div className="flex items-center gap-3 mb-8 lg:hidden">
                            <span className="text-[#F0A026] font-black text-4xl" style={{ lineHeight: 1, textShadow: '0 0 20px rgba(240,160,38,0.4)' }}>◈</span>
                            <span className="text-white font-black tracking-[0.3em] uppercase text-xl">ROOMS</span>
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-2">Login</h1>
                        <p className="text-[#71717a] text-sm mb-8">Enter your credentials to access your account</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-[#52525b] outline-none border transition-all duration-200 text-sm"
                                    style={{ backgroundColor: '#27272a', borderColor: '#3f3f46' }}
                                    onFocus={e => { e.target.style.borderColor = '#F0A026'; e.target.style.boxShadow = '0 0 0 3px rgba(240,160,38,0.12)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#3f3f46'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                        className="w-full px-4 py-3 pr-10 rounded-xl text-white placeholder-[#52525b] outline-none border transition-all duration-200 text-sm"
                                        style={{ backgroundColor: '#27272a', borderColor: '#3f3f46' }}
                                        onFocus={e => { e.target.style.borderColor = '#F0A026'; e.target.style.boxShadow = '0 0 0 3px rgba(240,160,38,0.12)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#3f3f46'; e.target.style.boxShadow = 'none'; }}
                                    />
                                    <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] transition-colors">
                                        {showPw ? (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Remember me + forgot */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-[#a1a1aa] cursor-pointer select-none">
                                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                                        className="w-4 h-4 rounded" style={{ accentColor: '#F0A026' }} />
                                    Remember me
                                </label>
                                <Link to="/forgot-password" className="text-[#F0A026] hover:text-[#ffc94a] transition-colors font-medium text-xs">
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Login button */}
                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl font-bold text-sm text-[#1b1d21] active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ backgroundColor: '#F0A026' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#ffc94a'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#F0A026'}
                            >
                                {loading ? 'Signing in…' : 'Login'}
                            </button>

                            {/* Google */}
                            <a href={`${API || 'http://localhost:5001'}/api/auth/google`}
                                className="w-full py-3 flex items-center justify-center gap-2.5 rounded-xl text-sm font-medium border transition-all duration-200 text-white"
                                style={{ backgroundColor: '#27272a', borderColor: '#3f3f46' }}
                                onMouseOver={e => e.currentTarget.style.borderColor = '#52525b'}
                                onMouseOut={e => e.currentTarget.style.borderColor = '#3f3f46'}
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </a>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px" style={{ background: '#3f3f46' }} />
                            <span className="text-xs text-[#71717a]">OR</span>
                            <div className="flex-1 h-px" style={{ background: '#3f3f46' }} />
                        </div>

                        {/* Guest Login */}
                        {!guestMode ? (
                            <button
                                type="button"
                                onClick={() => setGuestMode(true)}
                                className="w-full py-3 flex items-center justify-center gap-2.5 rounded-xl text-sm font-medium border transition-all duration-200 text-white"
                                style={{ backgroundColor: '#27272a', borderColor: '#3f3f46' }}
                                onMouseOver={e => e.currentTarget.style.borderColor = '#52525b'}
                                onMouseOut={e => e.currentTarget.style.borderColor = '#3f3f46'}
                            >
                                👤 Continue as Guest
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                    placeholder="Enter your name"
                                    autoFocus
                                    maxLength={30}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-[#52525b] outline-none border transition-all duration-200 text-sm"
                                    style={{ backgroundColor: '#27272a', borderColor: '#3f3f46' }}
                                    onFocus={e => { e.target.style.borderColor = '#F0A026'; e.target.style.boxShadow = '0 0 0 3px rgba(240,160,38,0.12)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#3f3f46'; e.target.style.boxShadow = 'none'; }}
                                    onKeyDown={e => e.key === 'Enter' && handleGuestLogin()}
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setGuestMode(false); setGuestName(''); }}
                                        className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all text-[#a1a1aa]"
                                        style={{ borderColor: '#3f3f46', background: 'transparent' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGuestLogin}
                                        disabled={guestLoading}
                                        className="flex-1 py-2.5 rounded-xl font-bold text-sm text-[#1b1d21] transition-all disabled:opacity-40"
                                        style={{ backgroundColor: '#F0A026' }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#ffc94a'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#F0A026'}
                                    >
                                        {guestLoading ? 'Joining...' : 'Join as Guest'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-center text-[#71717a] text-sm mt-5">
                            Not a member?{' '}
                            <Link to="/register" className="font-semibold transition-colors" style={{ color: '#F0A026' }}
                                onMouseOver={e => e.currentTarget.style.color = '#ffc94a'}
                                onMouseOut={e => e.currentTarget.style.color = '#F0A026'}
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
