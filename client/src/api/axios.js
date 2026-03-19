import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const orig = error.config;
        if (error.response?.status === 401 && !orig._retry && !orig.url?.includes('/auth/')) {
            orig._retry = true;
            try {
                const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
                sessionStorage.setItem('accessToken', data.accessToken);
                orig.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(orig);
            } catch {
                sessionStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
