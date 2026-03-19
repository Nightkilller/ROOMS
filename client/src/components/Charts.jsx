import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export function SignupsChart({ data }) {
    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-dark-100 mb-4">Signups (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                    <XAxis dataKey="date" tick={{ fill: '#6a6a8f', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fill: '#6a6a8f', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, color: '#e0e0ff' }} />
                    <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function LoginsChart({ data }) {
    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-dark-100 mb-4">Logins (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                    <XAxis dataKey="date" tick={{ fill: '#6a6a8f', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fill: '#6a6a8f', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, color: '#e0e0ff' }} />
                    <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function DevicesChart({ data }) {
    return (
        <div className="card">
            <h3 className="text-sm font-semibold text-dark-100 mb-4">Device Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {data?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, color: '#e0e0ff' }} />
                    <Legend wrapperStyle={{ color: '#9a9abf', fontSize: 12 }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
