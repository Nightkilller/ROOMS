require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
require('./config/passport');
const passport = require('passport');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const roomRoutes = require('./routes/room');
const chatRoutes = require('./routes/chat');
const uploadRoutes = require('./routes/upload');
const reviewRoutes = require('./routes/review');
const socketHandler = require('./socket/adminStats');
const chatSocket = require('./socket/chatSocket');
const videoSocket = require('./socket/videoSocket');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Allow both local dev and production Vercel URL
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    CLIENT_URL,
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, render health checks)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
};

const io = new Server(server, {
    cors: corsOptions,
});

// ─── Static Files & Middleware ────────────────────────────────
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

app.set('trust proxy', 1); // Trust reverse proxy (e.g., Render load balancer) for secure URLs

app.use(helmet({ crossOriginResourcePolicy: false })); // Allow cross-origin static files
app.use(hpp());
app.use(mongoSanitize());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(passport.initialize());

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── Socket.IO ───────────────────────────────────────────────
app.set('onlineUsers', 0);
socketHandler(io, app);

// Chat & Video socket handlers (run inside the same auth-protected io)
io.on('connection', (socket) => {
    chatSocket(io, socket);
    videoSocket(io, socket, socketHandler.userSockets);
});

// ─── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Auto-seed admin on first boot (safe — checks before creating)
const autoSeedAdmin = async () => {
    try {
        const bcrypt = require('bcryptjs');
        const User = require('./models/User');
        const email = 'adityagptaa17@gmail.com';
        const existing = await User.findOne({ email });
        if (!existing) {
            const passwordHash = await bcrypt.hash('Qwerty17@', 12);
            await User.create({ fullName: 'Aditya (Admin)', email, passwordHash, isVerified: true, role: 'admin' });
            console.log('✅ Admin auto-seeded');
        } else if (existing.role !== 'admin') {
            existing.role = 'admin';
            existing.isVerified = true;
            await existing.save();
            console.log('✅ Admin role upgraded');
        } else {
            console.log('✅ Admin already exists');
        }
    } catch (e) {
        console.error('⚠️ Auto-seed error:', e.message);
    }
};

connectDB().then(async () => {
    await autoSeedAdmin();
    server.listen(PORT, () => {
        console.log(`\n🚀 ROOMS server running on port ${PORT}`);
        console.log(`   Client: ${CLIENT_URL}\n`);
    });
});
