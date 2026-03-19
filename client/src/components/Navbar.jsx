import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out');
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <nav className="bg-[#0a0a0f] border-b border-[#1f1f2e] sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
                
                {/* Left: Logo */}
                <Link to="/dashboard" className="flex items-center gap-2 group outline-none rounded-lg p-1 transition-all duration-200 active:scale-95">
                    <span className="text-4xl text-[#F0A026] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 leading-none">◈</span>
                    <span className="text-[19px] font-extrabold tracking-[0.2em] text-[#e8eef7] mt-1">ROOMS</span>
                </Link>

                {/* Right: Navigation Links & Avatar */}
                {user && (
                    <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-1 no-scrollbar shrink-0 ml-4 max-w-[60vw] sm:max-w-none">
                        <Link to="/profile" className="text-sm font-medium text-[#c0c0d0] hover:text-white transition-colors flex items-center gap-1.5 shrink-0">
                            <span>👤</span> Profile
                        </Link>
                        <Link to="/review" className="text-sm font-medium text-[#c0c0d0] hover:text-white transition-colors flex items-center gap-1.5 shrink-0">
                            <span>⭐</span> Write a Review
                        </Link>
                        {user.role === 'admin' && (
                            <Link to="/admin" className="text-sm font-medium text-[#c0c0d0] hover:text-white transition-colors flex items-center gap-1.5 shrink-0">
                                <span>🛡️</span> Admin Panel
                            </Link>
                        )}
                        <button onClick={handleLogout} className="text-sm font-bold text-[#eb5757] hover:text-[#ff7676] transition-colors flex items-center gap-1.5 shrink-0 outline-none">
                            <span>🚪</span> Logout
                        </button>

                        {/* Static Avatar Badge */}
                        <div className="w-10 h-10 ml-2 rounded-full bg-gradient-to-tr from-[#2d1b69] to-[#45289f] flex items-center justify-center text-white font-bold text-sm shadow-[0_2px_12px_rgba(0,0,0,0.5)] border-2 border-[#1f1f2e] shrink-0 pointer-events-none">
                            {getInitials(user.fullName || user.email)}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                /* Hide scrollbar for Chrome, Safari and Opera */
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                /* Hide scrollbar for IE, Edge and Firefox */
                .no-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
        </nav>
    );
}
