import api from './axios';

// ── Chat Rooms ───────────────────────────────────────────────
export const getMyChats = () => api.get('/chat');

export const createDM = (userId) => api.post('/chat/dm', { userId });

export const createGroup = (name, participantIds) =>
    api.post('/chat/group', { name, participantIds });

// ── Messages ─────────────────────────────────────────────────
export const getMessages = (roomId, before = null, limit = 50) => {
    const params = { limit };
    if (before) params.before = before;
    return api.get(`/chat/${roomId}/messages`, { params });
};

// ── User Search ──────────────────────────────────────────────
export const searchUsers = (q) => api.get('/chat/users/search', { params: { q } });

// ── File Upload ──────────────────────────────────────────────
export const uploadFile = (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
            ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
            : undefined,
    });
};
