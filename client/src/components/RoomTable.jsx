import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

export default function RoomTable() {
    const [rooms, setRooms] = useState([]);
    const [stats, setStats] = useState({ totalRooms: 0, activeRooms: 0, totalMessages: 0, avgDuration: 0 });
    const socket = useSocket();

    const load = async () => {
        try {
            const [roomsRes, statsRes] = await Promise.all([
                api.get('/admin/rooms'),
                api.get('/admin/rooms/stats'),
            ]);
            setRooms(roomsRes.data);
            setStats(statsRes.data);
        } catch { }
    };

    useEffect(() => { load(); }, []);

    const terminate = async (code) => {
        try {
            await api.post(`/admin/rooms/${code}/terminate`);
            if (socket) socket.emit('admin-terminate-room', { roomCode: code });
            toast.success('Room terminated');
            load();
        } catch { toast.error('Failed'); }
    };

    const getTimeLeft = (exp) => {
        const diff = new Date(exp) - Date.now();
        if (diff <= 0) return 'Expired';
        const m = Math.floor(diff / 60000);
        return m > 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
    };

    return (
        <div className="space-y-4">
            {/* Room Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: '🏠', val: stats.totalRooms, label: 'Total Rooms', color: 'brand' },
                    { icon: '🟢', val: stats.activeRooms, label: 'Active Now', color: 'green' },
                    { icon: '💬', val: stats.totalMessages, label: 'Messages Sent', color: 'blue' },
                    { icon: '⏱', val: `${stats.avgDuration}m`, label: 'Avg Duration', color: 'purple' },
                ].map((s, i) => (
                    <div key={i} className="card p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/10 flex items-center justify-center text-lg`}>{s.icon}</div>
                        <div>
                            <p className="text-lg font-bold">{s.val}</p>
                            <p className="text-dark-300 text-xs">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Room Table */}
            {rooms.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-dark-700 text-dark-200 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 rounded-tl-lg">Code</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Host</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3">Expires In</th>
                                <th className="px-4 py-3">Users</th>
                                <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.map((r) => (
                                <tr key={r.roomCode} className="border-b border-dark-700 hover:bg-dark-700/50 transition">
                                    <td className="px-4 py-3 font-mono text-brand-400 font-bold">{r.roomCode}</td>
                                    <td className="px-4 py-3">{r.name}</td>
                                    <td className="px-4 py-3">{r.host}</td>
                                    <td className="px-4 py-3 text-dark-200">{new Date(r.createdAt).toLocaleTimeString()}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-green-400 text-xs font-medium">{getTimeLeft(r.expiresAt)}</span>
                                    </td>
                                    <td className="px-4 py-3">{r.activeUsers}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => terminate(r.roomCode)}
                                            className="text-xs text-red-400 hover:text-red-300 transition font-medium">
                                            Terminate
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-dark-300 text-sm text-center py-6">No active rooms</p>
            )}
        </div>
    );
}
