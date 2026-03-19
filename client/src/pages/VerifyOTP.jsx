import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function VerifyOTP() {
    const [params] = useSearchParams();
    const email = params.get('email');
    const purpose = params.get('purpose') || 'forgot';
    const remember = params.get('remember') === 'true';
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();
    const { verify2FA } = useAuth();

    useEffect(() => {
        if (cooldown > 0) {
            const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [cooldown]);

    const handleOTP = async (otp) => {
        setLoading(true);
        try {
            if (purpose === '2fa') {
                await verify2FA(email, otp, remember);
                toast.success('Login successful!');
                navigate('/dashboard');
            } else {
                const { data } = await api.post('/auth/verify-reset-otp', { email, otp });
                toast.success('OTP verified!');
                navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${data.resetSessionToken}`);
            }
        } catch (err) {
            const d = err.response?.data;
            if (d?.expired) toast.error('OTP expired. Please resend.');
            else if (d?.attemptsLeft != null) toast.error(`Invalid OTP. ${d.attemptsLeft} attempts left.`);
            else toast.error(d?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const resend = async () => {
        try {
            await api.post('/auth/resend-otp', { email, purpose });
            toast.success('OTP resent!');
            setCooldown(60);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Resend failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_20%_50%,rgba(139,92,246,0.08),transparent_60%)]">
            <div className="w-full max-w-md card animate-fade-in text-center">
                <span className="text-4xl block mb-4">{purpose === '2fa' ? '🔒' : '🔑'}</span>
                <h1 className="text-xl font-bold mb-2">{purpose === '2fa' ? 'Two-Factor Authentication' : 'Verify Reset Code'}</h1>
                <p className="text-dark-200 text-sm mb-6">Enter the 6-digit code sent to <strong className="text-dark-50">{email}</strong></p>

                <OTPInput onComplete={handleOTP} />

                {loading && <p className="text-brand-400 text-sm mt-4">Verifying...</p>}

                <div className="mt-6">
                    <button onClick={resend} disabled={cooldown > 0} className="btn-ghost text-sm">
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                    </button>
                </div>
            </div>
        </div>
    );
}
