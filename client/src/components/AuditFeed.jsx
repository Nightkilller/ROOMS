import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AuditFeed() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        api.get('/admin/audit-log?limit=20').then(({ data }) => setLogs(data.logs)).catch(() => { });
    }, []);

    const actionColors = {
        LOCK_USER: 'text-orange-400', UNLOCK_USER: 'text-green-400',
        DELETE_USER: 'text-red-400', FORCE_LOGOUT: 'text-blue-400',
        ADD_NOTE: 'text-brand-400',
    };

    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-dark-100 mb-4">Recent Audit Log</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {logs.map((l) => (
                    <div key={l._id} className="flex items-start gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                        <div>
                            <p>
                                <span className="text-dark-50 font-medium">{l.adminId?.fullName || 'Admin'}</span>
                                {' '}
                                <span className={actionColors[l.action] || 'text-dark-100'}>{l.action.replace(/_/g, ' ')}</span>
                                {l.targetUserId && <> on <span className="text-dark-50">{l.targetUserId?.email || 'user'}</span></>}
                            </p>
                            {l.details && <p className="text-dark-200 mt-0.5">{l.details}</p>}
                            <p className="text-dark-200 mt-0.5">{new Date(l.performedAt).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
                {logs.length === 0 && <p className="text-dark-200 text-xs">No audit events yet.</p>}
            </div>
        </div>
    );
}
