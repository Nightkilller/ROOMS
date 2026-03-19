import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = [
    { value: 'general', label: '💬 General' },
    { value: 'ui', label: '🎨 UI / Design' },
    { value: 'performance', label: '⚡ Performance' },
    { value: 'features', label: '🚀 Features' },
    { value: 'bug', label: '🐛 Bug Report' },
];

function StarRating({ value, onChange }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="text-3xl transition-transform duration-100 hover:scale-110 focus:outline-none"
                    style={{ color: star <= (hover || value) ? '#F0A026' : '#3f3f46' }}
                >
                    ★
                </button>
            ))}
        </div>
    );
}

export default function ReviewPage() {
    const [rating, setRating] = useState(0);
    const [category, setCategory] = useState('general');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [myReviews, setMyReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/reviews/mine')
            .then(({ data }) => setMyReviews(data))
            .catch(() => { })
            .finally(() => setLoadingReviews(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) { toast.error('Please select a star rating'); return; }
        if (!message.trim()) { toast.error('Please write a message'); return; }
        setLoading(true);
        try {
            const { data } = await api.post('/reviews', { rating, category, message: message.trim() });
            toast.success('Review submitted! Thank you 🎉');
            setMyReviews(prev => [data.review, ...prev]);
            setRating(0);
            setCategory('general');
            setMessage('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0f1012' }}>
            <Navbar />
            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 w-full flex-1">
                <div className="animate-fade-in">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-1" style={{ color: '#f4f4f5' }}>Leave a Review ⭐</h1>
                        <p className="text-sm" style={{ color: '#71717a' }}>Your feedback shapes ROOMS. Every review is read personally.</p>
                    </div>

                    {/* Submit Form */}
                    <div className="rounded-2xl border-2 p-6 mb-8" style={{ backgroundColor: '#1b1d21', borderColor: '#27272a' }}>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Star Rating */}
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: '#a1a1aa' }}>Rating</label>
                                <StarRating value={rating} onChange={setRating} />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>Category</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl text-white outline-none border transition-all duration-200 text-sm appearance-none cursor-pointer"
                                    style={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#f4f4f5' }}
                                    onFocus={e => { e.target.style.borderColor = '#F0A026'; }}
                                    onBlur={e => { e.target.style.borderColor = '#3f3f46'; }}
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value} style={{ background: '#27272a' }}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>
                                    Your Feedback <span style={{ color: '#52525b' }}>({message.length}/1000)</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value.slice(0, 1000))}
                                    placeholder="What do you think? What should we improve?"
                                    rows={5}
                                    className="w-full px-4 py-3 rounded-xl text-white placeholder-[#52525b] outline-none border transition-all duration-200 text-sm resize-none"
                                    style={{ backgroundColor: '#27272a', borderColor: '#3f3f46' }}
                                    onFocus={e => { e.target.style.borderColor = '#F0A026'; e.target.style.boxShadow = '0 0 0 3px rgba(240,160,38,0.12)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#3f3f46'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl font-bold text-sm text-[#1b1d21] active:scale-95 transition-all duration-200 disabled:opacity-40"
                                style={{ backgroundColor: '#F0A026' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#ffc94a'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = '#F0A026'}
                            >
                                {loading ? 'Submitting…' : 'Submit Review'}
                            </button>
                        </form>
                    </div>

                    {/* My Previous Reviews */}
                    <div>
                        <h2 className="text-lg font-bold mb-4" style={{ color: '#f4f4f5' }}>My Reviews</h2>
                        {loadingReviews ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-[#F0A02633] border-t-[#F0A026] rounded-full animate-spin" />
                            </div>
                        ) : myReviews.length === 0 ? (
                            <div className="text-center py-10 rounded-2xl border-2" style={{ borderColor: '#27272a', color: '#52525b' }}>
                                <div className="text-4xl mb-3">✍️</div>
                                <p className="text-sm">No reviews yet. Be the first to share your thoughts!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myReviews.map(r => (
                                    <div key={r._id} className="rounded-xl border p-4" style={{ backgroundColor: '#1b1d21', borderColor: '#27272a' }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span style={{ color: '#F0A026', fontSize: '1.1rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#27272a', color: '#a1a1aa' }}>
                                                    {CATEGORIES.find(c => c.value === r.category)?.label || r.category}
                                                </span>
                                                <span className="text-xs" style={{ color: '#52525b' }}>
                                                    {new Date(r.createdAt).toLocaleDateString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm" style={{ color: '#d4d4d8' }}>{r.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
