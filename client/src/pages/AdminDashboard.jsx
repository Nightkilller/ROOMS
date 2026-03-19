import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import StatsBar from '../components/StatsBar';
import { SignupsChart, LoginsChart, DevicesChart } from '../components/Charts';
import UserTable from '../components/UserTable';
import UserDetailModal from '../components/UserDetailModal';
import AuditFeed from '../components/AuditFeed';
import RoomTable from '../components/RoomTable';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STAR = '★'; const EMPTY = '☆';
const CATEGORY_LABELS = { general: '💬 General', ui: '🎨 UI/Design', performance: '⚡ Performance', features: '🚀 Features', bug: '🐛 Bug' };

export default function AdminDashboard() {
    const socket = useSocket();
    const [stats, setStats] = useState({});
    const [charts, setCharts] = useState({ signups: [], logins: [], devices: [] });
    const [users, setUsers] = useState({ users: [], total: 0, page: 1, pages: 1 });
    const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
    const [viewUserId, setViewUserId] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        loadStats(); loadCharts(); loadReviews();
    }, []);

    useEffect(() => {
        loadUsers();
    }, [filters]);

    useEffect(() => {
        if (!socket) return;
        socket.on('stats_update', setStats);
        return () => socket.off('stats_update', setStats);
    }, [socket]);

    const loadStats = async () => {
        try { const { data } = await api.get('/admin/stats'); setStats(data); } catch { }
    };
    const loadCharts = async () => {
        try { const { data } = await api.get('/admin/charts'); setCharts(data); } catch { }
    };
    const loadUsers = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filters.search) params.set('search', filters.search);
            if (filters.status) params.set('status', filters.status);
            params.set('page', filters.page);
            const { data } = await api.get(`/admin/users?${params}`);
            setUsers(data);
        } catch { }
    }, [filters]);

    const loadReviews = async () => {
        setLoadingReviews(true);
        try { const { data } = await api.get('/reviews'); setReviews(data); } catch { }
        finally { setLoadingReviews(false); }
    };

    const markRead = async (id) => {
        try {
            await api.patch(`/reviews/${id}/read`);
            setReviews(prev => prev.map(r => r._id === id ? { ...r, isRead: true } : r));
        } catch { toast.error('Failed to mark as read'); }
    };

    const handleRefresh = (newFilters) => {
        setFilters((p) => ({ ...p, ...newFilters }));
    };

    const exportData = async (type) => {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.set('status', filters.status);
            const url = `/admin/export/${type}?${params}`;
            const res = await api.get(url, { responseType: 'blob' });
            const blob = new Blob([res.data]);
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `rooms-report.${type}`;
            a.click();
            toast.success(`${type.toUpperCase()} downloaded`);
        } catch { toast.error('Export failed'); }
    };

    const unreadCount = reviews.filter(r => !r.isRead).length;

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#0f1012' }}>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h1 className="text-2xl font-bold" style={{ color: '#f4f4f5' }}>Admin Dashboard</h1>
                    <div className="flex gap-2">
                        <button onClick={() => exportData('pdf')} className="btn-secondary text-sm">📄 Export PDF</button>
                        <button onClick={() => exportData('csv')} className="btn-secondary text-sm">📊 Export CSV</button>
                    </div>
                </div>

                <StatsBar stats={stats} />

                <div className="grid md:grid-cols-3 gap-4">
                    <SignupsChart data={charts.signups} />
                    <LoginsChart data={charts.logins} />
                    <DevicesChart data={charts.devices} />
                </div>

                <h2 className="text-xl font-semibold pt-4" style={{ color: '#f4f4f5' }}>User Management</h2>
                <UserTable
                    users={users.users}
                    total={users.total}
                    page={users.page}
                    pages={users.pages}
                    onRefresh={handleRefresh}
                    onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
                    onViewUser={(id) => setViewUserId(id)}
                />

                <h2 className="text-xl font-semibold pt-6" style={{ color: '#f4f4f5' }}>Room Management</h2>
                <RoomTable />

                <div className="grid md:grid-cols-1 gap-4">
                    <AuditFeed />
                </div>

                {/* ── Reviews Section ── */}
                <div className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-xl font-semibold" style={{ color: '#f4f4f5' }}>User Reviews</h2>
                        {unreadCount > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F0A026', color: '#1b1d21' }}>
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {loadingReviews ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 border-2 border-[#F0A02633] border-t-[#F0A026] rounded-full animate-spin" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-8 rounded-2xl border-2" style={{ borderColor: '#27272a', color: '#52525b' }}>
                            No reviews yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reviews.map(r => (
                                <div key={r._id} className="rounded-xl border p-4" style={{ backgroundColor: '#1b1d21', borderColor: r.isRead ? '#27272a' : '#F0A02644' }}>
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div>
                                            <span className="font-semibold text-sm" style={{ color: '#f4f4f5' }}>{r.userId?.fullName}</span>
                                            <span className="text-xs ml-2" style={{ color: '#52525b' }}>{r.userId?.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span style={{ color: '#F0A026' }}>{STAR.repeat(r.rating)}{EMPTY.repeat(5 - r.rating)}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#27272a', color: '#a1a1aa' }}>
                                                {CATEGORY_LABELS[r.category] || r.category}
                                            </span>
                                            <span className="text-xs" style={{ color: '#52525b' }}>
                                                {new Date(r.createdAt).toLocaleDateString('en-IN')}
                                            </span>
                                            {!r.isRead && (
                                                <button onClick={() => markRead(r._id)}
                                                    className="text-xs px-2 py-0.5 rounded-lg border transition-all"
                                                    style={{ borderColor: '#F0A026', color: '#F0A026' }}
                                                >Mark read</button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm" style={{ color: '#d4d4d8' }}>{r.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {viewUserId && <UserDetailModal userId={viewUserId} onClose={() => { setViewUserId(null); loadUsers(); }} />}
            </main>
        </div>
    );
}
