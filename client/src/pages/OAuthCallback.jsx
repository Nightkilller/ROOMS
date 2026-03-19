import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function OAuthCallback() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { setUserFromToken } = useAuth();

    useEffect(() => {
        const token = params.get('token');
        const rt = params.get('rt'); // refresh token passed in URL for cross-domain support

        if (!token) {
            navigate('/login');
            return;
        }

        // Store the access token immediately
        sessionStorage.setItem('accessToken', token);

        if (rt) {
            // Cross-domain: set refresh cookie via API call with rt in body
            api.post('/auth/set-refresh-cookie', { rt })
                .then(({ data }) => {
                    const finalToken = data.accessToken || token;
                    sessionStorage.setItem('accessToken', finalToken);
                    setUserFromToken(finalToken, data.user);
                    navigate('/dashboard');
                })
                .catch(() => {
                    // Fallback: just use the access token as-is (15min session)
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        setUserFromToken(token, null);
                        navigate('/dashboard');
                    } catch {
                        navigate('/login');
                    }
                });
        } else {
            // Same-domain or cookie already set: use /auth/refresh
            api.post('/auth/refresh')
                .then(({ data }) => {
                    sessionStorage.setItem('accessToken', data.accessToken);
                    setUserFromToken(data.accessToken, data.user);
                    navigate('/dashboard');
                })
                .catch(() => navigate('/login'));
        }
    }, [params, navigate, setUserFromToken]);

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1b1d21' }}>
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-[#672AFA33] border-t-[#672AFA] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#a1a1aa] text-sm">Signing you in...</p>
            </div>
        </div>
    );
}
