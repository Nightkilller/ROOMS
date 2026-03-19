# ROOMS - The Future of Private Chat

## What is ROOMS?
ROOMS is a highly secure, real-time messaging and video calling platform built for private and uninterrupted conversations. It provides a sleek, modern, and fully responsive user interface inspired by premium tools, combined with a highly fortified backend architecture.

## Key Features
- **Real-Time Text Messaging**: Instant messaging powered by scalable Websockets.
- **Audio & Video Calling**: Secure, low-latency video and voice calls integrated with the ZEGOCLOUD Engine.
- **Firebase Authentication**: Robust Email & Password login with automated Email Verification and identity syncing.
- **Admin Dashboard**: Comprehensive role-based analytics, user management, and active room network monitoring.
- **Responsive Design**: Flawless experience across desktop and mobile devices featuring a gorgeous dark-mode aesthetic.
- **Media Sharing**: Seamless image sharing and in-browser voice note recording.

## Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS, Firebase Auth SDK, ZEGOCLOUD Prebuilt Call UI
- **Backend**: Node.js, Express.js, Socket.io, Firebase Admin SDK
- **Database**: MongoDB (Mongoose)

## Live Demo
Check out the live deployment here: [https://rooms-amber.vercel.app](https://rooms-amber.vercel.app)

---

## How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/Nightkilller/ROOMS.git
cd ROOMS
```

### 2. Setup the Backend
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory and add the required variables. Start the server:
```bash
npm run dev
```

### 3. Setup the Frontend
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory and add the required variables. Start the development server:
```bash
npm run dev
```

### Required Environment Variables

**Backend (`server/.env`)**
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_jwt_access_secret
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret
CLIENT_URL=http://localhost:5173
ADMIN_EMAILS=your_admin_email@example.com
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

**Frontend (`client/.env`)**
```env
VITE_API_URL=http://localhost:5001
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
```

<br/>
<p align="center">Built by Aditya with 🧠 and ☕️</p>
