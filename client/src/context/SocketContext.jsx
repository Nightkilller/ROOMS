import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

// In dev, Vite proxies HTTP but NOT WebSockets, so we connect directly to the backend.
// In production (same origin), VITE_API_URL can be left blank.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user) { setSocket(null); return; }
        const token = sessionStorage.getItem('accessToken');
        if (!token) return;

        const s = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            withCredentials: true,
        });

        s.on('connect', () => console.log('[Socket] connected:', s.id));
        s.on('connect_error', (err) => console.error('[Socket] error:', err.message));

        setSocket(s);
        return () => s.disconnect();
    }, [user]);

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
