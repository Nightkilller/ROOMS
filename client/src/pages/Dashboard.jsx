import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-[100dvh] flex flex-col bg-[#0b0b0b] text-zinc-100 font-sans selection:bg-white selection:text-black relative overflow-hidden">
            
            {/* ── Background Abstract Shapes (Resend Style) ── */}
            <div className="bg-shape-1" />
            <div className="bg-shape-2" />

            {/* Navbar sits above the background layer */}
            <div className="relative z-20">
                <Navbar />
            </div>

            {/* ── Main Layout (Mobile First Responsive) ── */}
            <main className="flex-1 w-full max-w-[840px] mx-auto px-5 sm:px-8 py-10 md:py-24 flex flex-col justify-center relative z-10">
                <div className="animate-fade-in-content w-full">
                    
                    {/* ── 1. Header / Greeting (Centered) ── */}
                    <div className="mb-10 md:mb-16 text-center mt-8 md:mt-0">
                        <h1 className="text-[32px] sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 md:mb-4 text-white drop-shadow-[0_2px_24px_rgba(255,255,255,0.15)]">
                            Welcome, {user?.fullName?.split(' ')[0]}
                        </h1>
                        <p className="text-[#a1a1aa] text-[15px] sm:text-[17px] md:text-[18px] max-w-lg mx-auto font-medium tracking-wide">
                            Your private, end-to-end encrypted space.
                        </p>
                    </div>

                    {/* ── 2. Action Cards Grid ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">
                        
                        {/* CREATE ROOM CARD */}
                        <button 
                            onClick={() => navigate('/create-room')}
                            className="group relative w-full text-left p-6 md:p-8 rounded-[24px] outline-none transition-all duration-300 active:scale-[0.98] md:hover:-translate-y-1 bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl md:hover:bg-white/[0.06] md:hover:border-white/[0.15] shadow-[0_4px_24px_rgba(0,0,0,0.5)] md:hover:shadow-[0_12px_40px_rgba(255,255,255,0.05)] overflow-hidden"
                        >
                            <div className="flex flex-col gap-4 md:gap-6">
                                <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-[14px] md:rounded-[16px] bg-white text-black flex items-center justify-center text-[22px] md:text-[24px] shadow-[0_4px_20px_rgba(255,255,255,0.2)] transition-transform duration-300 group-hover:scale-110">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 5v14M5 12h14"/>
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-[20px] md:text-[22px] font-bold text-white tracking-wide mb-1.5 md:mb-2 transition-colors group-hover:text-white">Create Room</h2>
                                    <p className="text-[14px] md:text-[15px] text-[#a1a1aa] leading-relaxed font-medium">
                                        Instantly launch a secure room and share the invite link with your peers.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* JOIN ROOM CARD */}
                        <button 
                            onClick={() => navigate('/join-room')}
                            className="group relative w-full text-left p-6 md:p-8 rounded-[24px] outline-none transition-all duration-300 active:scale-[0.98] md:hover:-translate-y-1 bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl md:hover:bg-white/[0.06] md:hover:border-white/[0.15] shadow-[0_4px_24px_rgba(0,0,0,0.5)] md:hover:shadow-[0_12px_40px_rgba(255,255,255,0.05)] overflow-hidden"
                        >
                            <div className="flex flex-col gap-4 md:gap-6">
                                <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-[14px] md:rounded-[16px] bg-[#1a1a1a] border border-white/20 flex items-center justify-center text-[22px] md:text-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-[20px] md:text-[22px] font-bold text-white tracking-wide mb-1.5 md:mb-2 transition-colors group-hover:text-white">Join Room</h2>
                                    <p className="text-[14px] md:text-[15px] text-[#a1a1aa] leading-relaxed font-medium">
                                        Have an invite code? Enter it here to securely join an ongoing conversation.
                                    </p>
                                </div>
                            </div>
                        </button>

                    </div>
                </div>
            </main>

            <style>{`
                /* ── Content Entrance ── */
                @keyframes fade-in-content {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-content {
                    animation: fade-in-content 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }

                /* ── Resend Style Background Shapes ── */
                .bg-shape-1 {
                    position: absolute;
                    top: -20%;
                    right: -10%;
                    width: 800px;
                    height: 800px;
                    /* Folded shape contour */
                    border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
                    background: radial-gradient(circle at 70% 30%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 50%, transparent 80%),
                                linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%);
                    /* Inner lighting and drop shadows */
                    box-shadow: inset -10px -10px 40px rgba(0,0,0,0.6), 
                                inset 20px 20px 80px rgba(255,255,255,0.4),
                                0 0 120px rgba(255,255,255,0.05);
                    filter: blur(40px);
                    opacity: 0;
                    animation: slide-in-tr 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    pointer-events: none;
                    z-index: 0;
                }

                .bg-shape-2 {
                    position: absolute;
                    bottom: -20%;
                    left: -10%;
                    width: 600px;
                    height: 600px;
                    border-radius: 40% 60% 30% 70% / 60% 50% 70% 40%;
                    background: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.08) 60%, transparent 80%),
                                linear-gradient(45deg, rgba(255,255,255,0.15) 0%, transparent 100%);
                    box-shadow: inset 10px 10px 30px rgba(0,0,0,0.5),
                                inset -20px -20px 50px rgba(255,255,255,0.1);
                    filter: blur(60px);
                    opacity: 0;
                    animation: slide-in-bl 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
                    pointer-events: none;
                    z-index: 0;
                }

                /* ── Entrance Animations ── */
                @keyframes slide-in-tr {
                    0% { opacity: 0; transform: translate(150px, -150px) scale(0.85); }
                    100% { opacity: 0.85; transform: translate(0, 0) scale(1); }
                }

                @keyframes slide-in-bl {
                    0% { opacity: 0; transform: translate(-100px, 100px) scale(0.9); }
                    100% { opacity: 0.35; transform: translate(0, 0) scale(1); }
                }

                /* Responsive adjustments */
                @media (max-width: 640px) {
                    .bg-shape-1 {
                        width: 500px;
                        height: 500px;
                        right: -30%;
                        top: -10%;
                        filter: blur(35px);
                    }
                    .bg-shape-2 {
                        width: 400px;
                        height: 400px;
                        left: -30%;
                        bottom: -10%;
                        filter: blur(45px);
                    }
                }
            `}</style>
        </div>
    );
}
