const rules = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function PasswordStrength({ password }) {
    const passed = rules.filter((r) => r.test(password)).length;
    const pct = (passed / rules.length) * 100;
    const color = pct <= 25 ? 'bg-red-500' : pct <= 50 ? 'bg-orange-500' : pct <= 75 ? 'bg-yellow-500' : 'bg-green-500';

    return (
        <div className="mt-2 space-y-2">
            <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-300 rounded-full`} style={{ width: `${pct}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-1">
                {rules.map((r, i) => (
                    <span key={i} className={`text-xs flex items-center gap-1 ${r.test(password) ? 'text-green-400' : 'text-dark-200'}`}>
                        {r.test(password) ? '✓' : '○'} {r.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function isPasswordValid(password) {
    return rules.every((r) => r.test(password));
}
