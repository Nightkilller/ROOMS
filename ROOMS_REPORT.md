# ROOMS - Technical Architecture & Capability Report

## Overview
ROOMS is a full-stack, real-time private messaging and video-calling application designed with a security-first approach and a premium user interface. The platform supports seamless websocket-based chat, integrated WebRTC video rooms via ZEGOCLOUD, and a fortified Firebase identity management system.

## Architectural Deep Dive

### 1. Frontend Architecture
**Frameworks & Libraries:** React.js, Vite, Tailwind CSS, React Router, React Hot Toast
**Pattern:** Component-based architecture utilizing Context Providers (`AuthContext`, `ChatContext`, `SocketContext`) for global state management.

- **Authentication View:** Features a high-conversion, dark-mode design with subtle glassmorphism and animated focus rings. Replaced traditional database-stored passwords with a direct Firebase App integration.
- **Chat Interface:** Highly optimized message rendering using localized state. Supports file uploads (images) natively, and features a built-in voice memo recorder leveraging the browser's `MediaRecorder` API.
- **Video Calling UI:** Pre-built ZEGOCLOUD UI Kit seamlessly injected into the React DOM. Features automatic Room ID generation using the proprietary messaging socket to negotiate video handshakes instantly.

### 2. Backend Infrastructure
**Frameworks & Libraries:** Node.js, Express, Socket.io, Mongoose, Firebase Admin SDK
**Pattern:** MVC (Model-View-Controller) pattern with dedicated middleware for Authentication (`verifyJWT`, `verifyAdmin`), Rate Limiting, and Payload Validation.

- **Identity Sync Engine:** Rather than manually managing password cryptographic hashes (`bcrypt`), the backend defers all sensitive credential verification to Google Firebase. Upon a successful Firebase login, the Frontend passes an `idToken` to `/api/auth/firebase-login`. The Express server uses the `firebase-admin` SDK to decrypt the token, assert its authenticity, and then generates an internal JWT (`accessToken` / `refreshToken`) to authorize private WebSocket events and REST APIs via MongoDB.
- **Real-Time Websockets:** `Socket.io` is uniquely configured to handle parallel message broadcasting, user typing indicators, online presence, and video call signaling (ringing/answering/declining).
- **Administrative Command Center:** A specialized route layer exclusively accessible to `role: 'admin'`. Offers real-time metrics, user lifecycle management, and active room moderation. Admin privileges are securely injected via isolated environment variables (`ADMIN_EMAILS`) to prevent Git identity leaks.

### 3. Database Design
**Engine:** MongoDB (via Mongoose ORM)
**Core Collections:**
- **Users:** Stores profiles, metadata, and the mapped `firebaseUid` to link internal application logic with Google's authentication pool.
- **Rooms:** Handles chat room creation, multi-user association, and metadata.
- **Messages:** Scalable document structure capturing Sender ID, Room ID, Text Payload, and Media Attachments.
- **Analytics/Audits:** Tracks high-level administrative events and platform growth metrics.

---

## LinkedIn Post Template

*(Copy and paste the text below into LinkedIn!)*

🚀 **I'm thrilled to unveil my latest full-stack project: ROOMS!** 

ROOMS is a highly secure, real-time messaging and video calling platform built entirely from the ground up for private uninterrupted conversations. I designed the architecture to feel as premium as tools like Resend or Stripe, while packing serious functionality under the hood!

**💡 Key Features I Built:**
🔹 **Real-Time Texting:** Instant message broadcasting and typing indicators powered by WebSockets (`Socket.io`).
🔹 **HD Video Calling:** Seamless, low-latency browser video & audio calls integrated natively using the ZEGOCLOUD Engine.
🔹 **Fortified Security:** Fully migrated from traditional hashed passwords to a robust Firebase Identity Auth system with secure JWT session syncing on the Node backend.
🔹 **Command Dashboard:** A comprehensive Admin Panel offering real-time metric visualization, user management, and room tracking.
🔹 **Rich Media Support:** Native image uploads and in-browser voice memo recording!

**🛠️ The Tech Stack:**
- **Frontend:** React.js, Vite, Tailwind CSS, ZEGOCLOUD UI
- **Backend:** Node.js, Express.js, Socket.io
- **Identity & DB:** Firebase Admin SDK & MongoDB (Mongoose)
- **Deployment:** Vercel (Client) & Render (Server)

I'm incredibly proud of the clean, dark-mode UI and the seamless API handshakes happening behind the scenes. 

Check out the Live Demo here: https://rooms-amber.vercel.app 
*(Or feel free to check out the codebase on my GitHub!)*

Let me know what you think in the comments! 👇 

#FullStackDevelopment #ReactJS #NodeJS #WebSockets #Firebase #WebRTC #SoftwareEngineering #Portfolio
