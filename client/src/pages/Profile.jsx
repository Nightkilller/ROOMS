import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PasswordStrength, { isPasswordValid } from '../components/PasswordStrength';
import OTPInput from '../components/OTPInput';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [twoFAStep, setTwoFAStep] = useState(null); // null | 'otp-enable' | 'otp-disable'
    const [deleteStep, setDeleteStep] = useState(null); // null | 'confirm' | 'otp'

    useEffect(() => { loadProfile(); loadSessions(); }, []);

    const loadProfile = async () => {
        try { const { data } = await api.get('/user/profile'); setProfile(data); } catch { }
    };
    const loadSessions = async () => {
        try { const { data } = await api.get('/user/sessions'); setSessions(data); } catch { }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (!isPasswordValid(newPw)) return toast.error('Password does not meet requirements');
        setPwLoading(true);
        try {
            await api.post('/user/change-password', { currentPassword: currentPw, newPassword: newPw });
            toast.success('Password changed!');
            setCurrentPw(''); setNewPw('');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setPwLoading(false); }
    };

    const toggle2FA = async () => {
        try {
            if (profile?.twoFactorEnabled) {
                await api.post('/auth/disable-2fa');
                setTwoFAStep('otp-disable');
            } else {
                await api.post('/auth/enable-2fa');
                setTwoFAStep('otp-enable');
            }
            toast.success('OTP sent to your email');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const confirm2FACode = async (otp) => {
        try {
            const action = twoFAStep === 'otp-enable' ? 'enable' : 'disable';
            await api.post('/auth/confirm-2fa', { otp, action });
            toast.success(`2FA ${action}d!`);
            setTwoFAStep(null);
            loadProfile();
        } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP'); }
    };

    const logoutAll = async () => {
        await api.post('/user/logout-all');
        toast.success('Logged out of all devices');
    };

    const requestDelete = async () => {
        try {
            await api.post('/user/request-delete');
            toast.success('OTP sent for deletion confirmation');
            setDeleteStep('otp');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const confirmDelete = async (otp) => {
        try {
            await api.post('/user/confirm-delete', { otp });
            toast.success('Account deleted');
            logout();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="min-h-screen bg-dark-900">
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
                {/* Profile Info */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4">Profile</h2>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-dark-700 rounded-lg"><span className="text-dark-200 block">Name</span>{profile?.fullName}</div>
                        <div className="p-3 bg-dark-700 rounded-lg"><span className="text-dark-200 block">Email</span>{profile?.email}</div>
                        <div className="p-3 bg-dark-700 rounded-lg"><span className="text-dark-200 block">Joined</span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</div>
                        <div className="p-3 bg-dark-700 rounded-lg"><span className="text-dark-200 block">Status</span>
                            <span className="text-green-400">✓ Verified</span>
                        </div>
                    </div>
                </div>

                {/* 2FA */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${profile?.twoFactorEnabled ? 'bg-green-500/15 text-green-400' : 'bg-dark-400 text-dark-200'}`}>
                            {profile?.twoFactorEnabled ? '✓ Enabled' : 'Disabled'}
                        </span>
                    </div>
                    {twoFAStep ? (
                        <div className="text-center">
                            <p className="text-dark-200 text-sm mb-4">Enter the OTP sent to your email</p>
                            <OTPInput onComplete={confirm2FACode} />
                            <button onClick={() => setTwoFAStep(null)} className="btn-ghost text-sm mt-4">Cancel</button>
                        </div>
                    ) : (
                        <button onClick={toggle2FA} className={profile?.twoFactorEnabled ? 'btn-danger' : 'btn-primary'}>
                            {profile?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                        </button>
                    )}
                </div>

                {/* Change Password */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                    <form onSubmit={changePassword} className="space-y-3">
                        <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Current password" required className="input-field" />
                        <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password" required className="input-field" />
                        <PasswordStrength password={newPw} />
                        <button type="submit" disabled={pwLoading} className="btn-primary">{pwLoading ? 'Changing...' : 'Change Password'}</button>
                    </form>
                </div>

                {/* Session History */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Login History</h2>
                        <button onClick={logoutAll} className="btn-secondary text-sm">Logout All Devices</button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {sessions.map((s) => (
                            <div key={s._id} className="flex justify-between items-center text-sm p-3 bg-dark-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${s.successful ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <div>
                                        <p className="font-medium">{s.browser} · {s.device}</p>
                                        <p className="text-dark-200 text-xs">{s.city}, {s.country} · IP: {s.ipAddress}</p>
                                    </div>
                                </div>
                                <span className="text-dark-200 text-xs text-right">{new Date(s.loginAt).toLocaleString()}</span>
                            </div>
                        ))}
                        {sessions.length === 0 && <p className="text-dark-200 text-sm">No sessions yet.</p>}
                    </div>
                </div>

                {/* Delete Account */}
                <div className="card border-red-500/20">
                    <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
                    {deleteStep === 'otp' ? (
                        <div className="text-center">
                            <p className="text-dark-200 text-sm mb-4">Enter OTP to confirm account deletion</p>
                            <OTPInput onComplete={confirmDelete} />
                            <button onClick={() => setDeleteStep(null)} className="btn-ghost text-sm mt-4">Cancel</button>
                        </div>
                    ) : deleteStep === 'confirm' ? (
                        <div>
                            <p className="text-dark-200 text-sm mb-4">This action is <strong className="text-red-400">irreversible</strong>. An OTP will be sent to confirm.</p>
                            <div className="flex gap-3">
                                <button onClick={requestDelete} className="btn-danger">Yes, Delete My Account</button>
                                <button onClick={() => setDeleteStep(null)} className="btn-ghost">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setDeleteStep('confirm')} className="btn-danger">Delete Account</button>
                    )}
                </div>
            </main>
        </div>
    );
}
