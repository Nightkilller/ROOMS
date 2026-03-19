import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import PasswordStrength, { isPasswordValid } from '../components/PasswordStrength';
import toast from 'react-hot-toast';

export default function Register() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!isPasswordValid(password)) return toast.error('Password does not meet all requirements');
        if (password !== confirm) return toast.error('Passwords do not match');
        setLoading(true);
        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            
            // Set their display name right away
            await updateProfile(userCred.user, { displayName: fullName });
            
            // Trigger Firebase to send verification email
            await sendEmailVerification(userCred.user);
            
            toast.success('Registration successful! Please check your email inbox to verify your account.');
            navigate('/login');
        } catch (err) {
            console.error('Registration error:', err);
            if (err.code === 'auth/email-already-in-use') {
                toast.error('Email is already registered. Please log in.');
            } else {
                toast.error(err.message || 'Failed to register account');
            }
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        backgroundColor: '#27272a',
        borderColor: '#3f3f46',
    };
    const focusInput = (e) => {
        e.target.style.borderColor = '#F0A026';
        e.target.style.boxShadow = '0 0 0 3px rgba(240,160,38,0.12)';
    };
    const blurInput = (e) => {
        e.target.style.borderColor = '#3f3f46';
        e.target.style.boxShadow = 'none';
    };

    return (
        <div className="min-h-screen bg-[#0f1012] flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] animate-fade-in"
                style={{ minHeight: 560 }}>

                {/* ── Left Panel: Iridescent Gradient ── */}
                <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-8 overflow-hidden"
                    style={{
                        background: `
                            radial-gradient(ellipse at 70% 30%, rgba(103,42,250,0.9) 0%, transparent 55%),
                            radial-gradient(ellipse at 20% 80%, rgba(236,72,153,0.7) 0%, transparent 50%),
                            radial-gradient(ellipse at 90% 80%, rgba(240,160,38,0.6) 0%, transparent 45%),
                            radial-gradient(ellipse at 10% 20%, rgba(6,182,212,0.5) 0%, transparent 50%),
                            radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.4) 0%, transparent 60%),
                            #0a0812
                        `
                    }}>
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%, rgba(240,160,38,0.08) 100%)' }} />
                    <div className="relative z-10 flex items-center gap-2">
                        <span className="text-2xl text-[#F0A026]" style={{ lineHeight: 1 }}>◈</span>
                        <span className="text-white font-extrabold tracking-widest text-sm">ROOMS</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-white text-3xl font-light leading-tight">
                            Join the Future<br />
                            of <span className="font-extrabold">Private Chat</span>
                        </p>
                    </div>
                </div>

                {/* ── Right Panel: Dark Form ── */}
                <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-10"
                    style={{ backgroundColor: '#1b1d21' }}>
                    <div className="w-full max-w-sm">
                        <div className="flex items-center gap-2 mb-7 lg:hidden">
                            <span className="text-2xl text-[#F0A026]" style={{ lineHeight: 1 }}>◈</span>
                            <span className="text-white font-extrabold tracking-widest text-sm">ROOMS</span>
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-1">Create Account</h1>
                        <p className="text-[#71717a] text-sm mb-7">Fill in the details to get started</p>

                        <form onSubmit={handleSignUp} className="space-y-4">
                                <>
                                    {[
                                        { label: 'Full Name', type: 'text', val: fullName, set: setFullName, ph: 'John Doe' },
                                        { label: 'Email', type: 'email', val: email, set: setEmail, ph: 'you@example.com' },
                                    ].map(({ label, type, val, set, ph }) => (
                                        <div key={label}>
                                            <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">{label}</label>
                                            <input type={type} value={val} onChange={e => set(e.target.value)}
                                                placeholder={ph} required
                                                className="w-full px-4 py-3 rounded-xl text-white placeholder-[#52525b] outline-none border transition-all duration-200 text-sm"
                                                style={inputStyle} onFocus={focusInput} onBlur={blurInput}
                                            />
                                        </div>
                                    ))}

                                    <div>
                                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Password</label>
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                            placeholder="Min 8 characters" required
                                            className="w-full px-4 py-3 rounded-xl text-white placeholder-[#52525b] outline-none border transition-all duration-200 text-sm mb-2"
                                            style={inputStyle} onFocus={focusInput} onBlur={blurInput}
                                        />
                                        <PasswordStrength password={password} />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Confirm Password</label>
                                        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                                            placeholder="••••••••" required
                                            className="w-full px-4 py-3 rounded-xl text-white placeholder-[#52525b] outline-none border transition-all duration-200 text-sm"
                                            style={inputStyle} onFocus={focusInput} onBlur={blurInput}
                                        />
                                    </div>
                                </>
                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl font-bold text-sm text-[#1b1d21] active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                                style={{ backgroundColor: '#F0A026' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#ffc94a'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#F0A026'}
                            >
                                {loading ? 'Creating...' : 'Create Account'}
                            </button>
                        </form>

                        <p className="text-center text-[#71717a] text-sm mt-5">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold" style={{ color: '#F0A026' }}
                                onMouseOver={e => e.currentTarget.style.color = '#ffc94a'}
                                onMouseOut={e => e.currentTarget.style.color = '#F0A026'}
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
