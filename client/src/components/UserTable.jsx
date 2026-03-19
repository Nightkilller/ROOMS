import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function UserTable({ users, total, page, pages, onRefresh, onPageChange, onViewUser }) {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');

    const handleSearch = () => {
        onRefresh?.({ search, status, page: 1 });
    };

    const handleAction = async (userId, action) => {
        try {
            if (action === 'lock') await api.post(`/admin/users/${userId}/lock`);
            if (action === 'unlock') await api.post(`/admin/users/${userId}/unlock`);
            if (action === 'force-logout') await api.post(`/admin/users/${userId}/force-logout`);
            if (action === 'delete') {
                if (!window.confirm('Delete this user permanently?')) return;
                await api.delete(`/admin/users/${userId}`);
            }
            toast.success(`Action "${action}" completed`);
            onRefresh?.({});
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed');
        }
    };

    return (
        <div className="card p-0 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-brand-500/15 flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="input-field flex-1 min-w-[200px] !py-2 text-sm"
                />
                <select value={status} onChange={(e) => { setStatus(e.target.value); onRefresh?.({ search, status: e.target.value, page: 1 }); }}
                    className="input-field !w-auto !py-2 text-sm">
                    <option value="">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                    <option value="locked">Locked</option>
                </select>
                <button onClick={handleSearch} className="btn-secondary text-sm !py-2">Search</button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-dark-700">
                        <tr className="text-dark-100 text-left">
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium hidden md:table-cell">Joined</th>
                            <th className="px-4 py-3 font-medium hidden lg:table-cell">Last Login</th>
                            <th className="px-4 py-3 font-medium hidden lg:table-cell">City</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-500/10">
                        {users?.map((u) => (
                            <tr key={u._id} className="hover:bg-dark-400/30 transition">
                                <td className="px-4 py-3 font-medium">{u.fullName}</td>
                                <td className="px-4 py-3 text-dark-100">{u.email}</td>
                                <td className="px-4 py-3 text-dark-200 hidden md:table-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-dark-200 hidden lg:table-cell">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}</td>
                                <td className="px-4 py-3 text-dark-200 hidden lg:table-cell">{u.lastCity || '—'}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${u.isLocked ? 'bg-red-500/15 text-red-400' : u.isVerified ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                                        {u.isLocked ? 'Locked' : u.isVerified ? 'Verified' : 'Unverified'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-1 flex-wrap">
                                        <button onClick={() => onViewUser?.(u._id)} className="text-brand-400 hover:text-brand-300 text-xs px-2 py-1 rounded hover:bg-brand-500/10">View</button>
                                        {u.isLocked
                                            ? <button onClick={() => handleAction(u._id, 'unlock')} className="text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded hover:bg-green-500/10">Unlock</button>
                                            : <button onClick={() => handleAction(u._id, 'lock')} className="text-orange-400 hover:text-orange-300 text-xs px-2 py-1 rounded hover:bg-orange-500/10">Lock</button>
                                        }
                                        <button onClick={() => handleAction(u._id, 'force-logout')} className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded hover:bg-blue-500/10">Logout</button>
                                        <button onClick={() => handleAction(u._id, 'delete')} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="p-4 border-t border-brand-500/15 flex items-center justify-between text-sm">
                    <span className="text-dark-200">{total} users total</span>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => onPageChange?.(page - 1)} className="btn-ghost text-xs disabled:opacity-30">← Prev</button>
                        <span className="text-dark-100 px-2 py-1">{page} / {pages}</span>
                        <button disabled={page >= pages} onClick={() => onPageChange?.(page + 1)} className="btn-ghost text-xs disabled:opacity-30">Next →</button>
                    </div>
                </div>
            )}
        </div>
    );
}
