import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import ChatRoom from './pages/ChatRoom';
import MessagesPage from './pages/MessagesPage';
import ReviewPage from './pages/ReviewPage';
import './index.css';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SocketProvider>
                    <ChatProvider>
                        <Toaster position="top-right" toastOptions={{
                            style: { background: '#1a1a2e', color: '#e0e0ff', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px' },
                            success: { iconTheme: { primary: '#8b5cf6', secondary: '#fff' } },
                        }} />
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/verify-otp" element={<VerifyOTP />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/oauth-callback" element={<OAuthCallback />} />
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                            <Route path="/create-room" element={<ProtectedRoute><CreateRoom /></ProtectedRoute>} />
                            <Route path="/join-room" element={<ProtectedRoute><JoinRoom /></ProtectedRoute>} />
                            <Route path="/room/:code" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
                            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                            <Route path="/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
                            <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </ChatProvider>
                </SocketProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
