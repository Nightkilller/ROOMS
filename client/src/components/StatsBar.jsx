export default function StatsBar({ stats }) {
    const cards = [
        { label: 'Total Users', value: stats?.total ?? '—', icon: '👥', color: 'from-brand-600 to-brand-500' },
        { label: 'Online Now', value: stats?.online ?? '—', icon: '🟢', color: 'from-green-600 to-green-500' },
        { label: 'New Today', value: stats?.newToday ?? '—', icon: '📈', color: 'from-blue-600 to-blue-500' },
        { label: 'This Week', value: stats?.newThisWeek ?? '—', icon: '📊', color: 'from-purple-600 to-purple-500' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
                <div key={c.label} className="card flex items-center gap-4 hover:border-brand-500/30 transition">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-xl shadow-lg`}>
                        {c.icon}
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-dark-50">{c.value}</p>
                        <p className="text-xs text-dark-100">{c.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
