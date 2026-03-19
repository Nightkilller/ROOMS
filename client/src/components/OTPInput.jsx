import { useRef, useState } from 'react';

export default function OTPInput({ length = 6, onComplete }) {
    const [values, setValues] = useState(Array(length).fill(''));
    const refs = useRef([]);

    const handleChange = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...values];
        next[i] = val;
        setValues(next);

        if (val && i < length - 1) refs.current[i + 1]?.focus();
        const code = next.join('');
        if (code.length === length) onComplete?.(code);
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (!data) return;
        const next = Array(length).fill('');
        data.split('').forEach((c, i) => { next[i] = c; });
        setValues(next);
        if (data.length === length) onComplete?.(data);
        else refs.current[data.length]?.focus();
    };

    return (
        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {values.map((v, i) => (
                <input
                    key={i}
                    ref={(el) => (refs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-mono font-bold bg-dark-800 border-2 border-brand-500/20 rounded-lg text-brand-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 outline-none transition"
                />
            ))}
        </div>
    );
}
