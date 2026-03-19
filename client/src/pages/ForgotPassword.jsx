import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
            toast.success('If the email exists, an OTP has been sent.');
            setTimeout(() => navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=forgot`), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_20%_50%,rgba(139,92,246,0.08),transparent_60%)]">
            <div className="w-full max-w-md card animate-fade-in text-center">
                <span className="text-4xl block mb-4">🔑</span>
                <h1 className="text-xl font-bold mb-2">Forgot Password</h1>
                <p className="text-dark-200 text-sm mb-6">Enter your email and we'll send you a reset code</p>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="input-field" />
                        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Sending...' : 'Send OTP'}</button>
                    </form>
                ) : (
                    <p className="text-green-400 text-sm">Check your email for the OTP. Redirecting...</p>
                )}
            </div>
        </div>
    );
}
