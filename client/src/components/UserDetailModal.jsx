import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function UserDetailModal({ userId, onClose }) {
    const [data, setData] = useState(null);
    const [note, setNote] = useState('');

    useEffect(() => {
        api.get(`/admin/users/${userId}`).then(({ data }) => setData(data)).catch(() => toast.error('Failed to load user'));
    }, [userId]);

    const addNote = async () => {
        if (!note.trim()) return;
        try {
            await api.post(`/admin/users/${userId}/notes`, { note });
            toast.success('Note added');
            setNote('');
            const { data: d } = await api.get(`/admin/users/${userId}`);
            setData(d);
        } catch { toast.error('Failed to add note'); }
    };

    if (!data) return null;
    const { user, sessions, notes } = data;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-dark-600 border border-brand-500/20 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-brand-500/15 flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-semibold">{user.fullName}</h2>
                        <p className="text-sm text-dark-100">{user.email}</p>
                        <div className="flex gap-2 mt-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${user.isVerified ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                                {user.isVerified ? '✓ Verified' : 'Unverified'}
                            </span>
                            {user.twoFactorEnabled && <span className="px-2 py-0.5 text-xs rounded-full bg-brand-500/15 text-brand-400">2FA</span>}
                            {user.isLocked && <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/15 text-red-400">Locked</span>}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-dark-200 hover:text-dark-50 text-xl">✕</button>
                </div>

                {/* Sessions */}
                <div className="p-6 border-b border-brand-500/15">
                    <h3 className="text-sm font-semibold text-dark-100 mb-3">Login History</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {sessions?.map((s) => (
                            <div key={s._id} className="flex justify-between items-center text-xs p-2 bg-dark-700 rounded-lg">
                                <div>
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${s.successful ? 'bg-green-500' : 'bg-red-500'}`} />
                                    {s.browser} · {s.device}
                                </div>
                                <div className="text-dark-200 text-right">
                                    <div>{s.city}, {s.country}</div>
                                    <div>{new Date(s.loginAt).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                        {sessions?.length === 0 && <p className="text-dark-200 text-xs">No sessions recorded.</p>}
                    </div>
                </div>

                {/* Notes */}
                <div className="p-6">
                    <h3 className="text-sm font-semibold text-dark-100 mb-3">Admin Notes</h3>
                    <div className="flex gap-2 mb-3">
                        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." className="input-field !py-2 text-sm flex-1" />
                        <button onClick={addNote} className="btn-primary !py-2 text-sm">Add</button>
                    </div>
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                        {notes?.map((n) => (
                            <div key={n._id} className="text-xs p-2 bg-dark-700 rounded-lg">
                                <p className="text-dark-50">{n.note}</p>
                                <p className="text-dark-200 mt-1">{n.adminId?.fullName} · {new Date(n.createdAt).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
