import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PasswordStrength, { isPasswordValid } from '../components/PasswordStrength';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ResetPassword() {
    const [params] = useSearchParams();
    const email = params.get('email');
    const resetSessionToken = params.get('token');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isPasswordValid(password)) return toast.error('Password does not meet requirements');
        if (password !== confirm) return toast.error('Passwords do not match');
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, resetSessionToken, newPassword: password });
            toast.success('Password reset! Please log in.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_20%_50%,rgba(139,92,246,0.08),transparent_60%)]">
            <div className="w-full max-w-md card animate-fade-in text-center">
                <span className="text-4xl block mb-4">🔐</span>
                <h1 className="text-xl font-bold mb-2">Set New Password</h1>
                <p className="text-dark-200 text-sm mb-6">Choose a strong password for your account</p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm text-dark-100 mb-1.5">New Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required />
                        <PasswordStrength password={password} />
                    </div>
                    <div>
                        <label className="block text-sm text-dark-100 mb-1.5">Confirm Password</label>
                        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" required />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Resetting...' : 'Reset Password'}</button>
                </form>
            </div>
        </div>
    );
}
