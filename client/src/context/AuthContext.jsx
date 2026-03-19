import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restore = async () => {
            try {
                const { data } = await api.post('/auth/refresh');
                sessionStorage.setItem('accessToken', data.accessToken);
                setUser(data.user);
            } catch {
                sessionStorage.removeItem('accessToken');
            } finally {
                setLoading(false);
            }
        };
        restore();
    }, []);

    const login = useCallback(async (email, password, rememberMe) => {
        const { data } = await api.post('/auth/login', { email, password, rememberMe });
        if (data.requires2FA) return data;
        sessionStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        return data;
    }, []);

    const verify2FA = useCallback(async (email, otp, rememberMe) => {
        const { data } = await api.post('/auth/verify-2fa', { email, otp, rememberMe });
        sessionStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        return data;
    }, []);

    const sendSignupOTP = useCallback(async (fullName, email, password) => {
        const { data } = await api.post('/auth/send-signup-otp', { fullName, email, password });
        return data;
    }, []);

    const verifySignupOTP = useCallback(async (email, otp) => {
        const { data } = await api.post('/auth/verify-signup-otp', { email, otp });
        return data;
    }, []);

    const register = useCallback(async (email) => {
        const { data } = await api.post('/auth/register', { email });
        sessionStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        return data;
    }, []);

    const logout = useCallback(async () => {
        try { await api.post('/auth/logout'); } catch { }
        sessionStorage.removeItem('accessToken');
        setUser(null);
    }, []);

    const setUserFromToken = useCallback((token, userData) => {
        sessionStorage.setItem('accessToken', token);
        setUser(userData);
    }, []);

    const guestLogin = useCallback(async (name) => {
        const { data } = await api.post('/auth/guest', { name });
        sessionStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        return data;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, verify2FA, sendSignupOTP, verifySignupOTP, register, logout, setUserFromToken, guestLogin }}>
            {children}
        </AuthContext.Provider>
    );
};
