# 🚀 ROOMS — Complete Project Overview & Developer Guide

This document is specifically created to explain **everything** that makes the ROOMS project work. It covers the core technologies, features, database models, and how the different systems interact with each other.

---

## 🛠️ 1. Technology Stack
*   **Frontend**: React.js (built with Vite for speed), Tailwind CSS (for styling), React Router DOM (for navigation).
*   **Backend**: Node.js, Express.js (REST API framework).
*   **Database**: MongoDB (NoSQL database), Mongoose (Object Data Modeling).
*   **Real-time Communication**: Socket.IO (for instant text messaging), WebRTC (for peer-to-peer video/audio calls).
*   **Authentication**: JSON Web Tokens (JWT) for secure, stateless sessions, combined with Google OAuth 2.0.
*   **Emails**: Resend API (for transactional emails like welcomes and OTPs).

---

## 🌟 2. Core Features & How They Work

### A. Authentication & Security
The authentication system is highly secure and feature-rich.
*   **Standard Login/Signup**: Users can register with email and password. Passwords are encrypted using `bcrypt`.
*   **Google OAuth**: Users can log in instantly using their Google account. 
*   **JWT & Cookies**: When a user logs in, the server generates an `access_token` (short-lived, sent to frontend) and a `refresh_token` (long-lived, stored in a secure HTTP-only cookie). This keeps the user logged in without exposing the permanent token to XSS attacks.
*   **Device Tracking & Alerts**: Every time a user logs in, the system parses their `userAgent` and IP address to figure out their device (e.g., iPhone) and location. If they log in from a new device, it triggers an instant email alert (`newDeviceAlert`).
*   **2FA (Two-Factor Authentication)**: Users get a One-Time Password (OTP) sent to their email during sensitive actions.

### B. Chat Rooms (The Core Feature)
Rooms are temporary, isolated spaces where users can chat.
*   **Room Creation**: A user creates a room and sets a duration (e.g., 10 mins, 1 hour). The server generates a unique alphanumeric `code` (e.g., `A1B2C3`).
*   **Joining**: Other users enter this code to securely join. They are prompted for a temporary `nickname` used only in that room.
*   **Expiration**: The server continuously checks for expired rooms. Once the time is up, the room becomes locked, and users are completely blocked from sending new messages.

### C. Real-Time Chat System (Socket.IO)
This is what makes the chat instantly appear on screens without reloading.
*   **`join-room`**: When a user enters the room page, their connection is added to a specific Socket.IO "room".
*   **`send-message`**: When typing a message, it goes to the server, which then instantly broadcasts it to everyone else in that specific room code.
*   **Typing Indicators**: As a user types, an event is fired giving real-time "Subin is typing..." feedback.
*   **Reactions**: Users can react to specific messages with emojis, updating live for everyone.
*   **File Uploads**: Users can attach images and files via Cloudinary or local storage uploads, passing the URL in the chat.

### D. Peer-to-Peer Video & Audio Calling (WebRTC)
The `📹 Video` button initiates a completely private, encrypted peer-to-peer connection.
*   **WebRTC**: Instead of sending video through the server (which uses massive bandwidth), WebRTC connects User A directly to User B.
*   **Signaling Server**: The Socket.IO server acts only as a "matchmaker" (Signaling). User A says "I want to call User B." The server passes this request. Once accepted, the browsers negotiate their own direct connection.
*   **Media Streams**: Users can toggle their webcam (📷) and microphone (🎤) on/off, interacting directly with browser APIs (`navigator.mediaDevices.getUserMedia`).

### E. The Admin Dashboard
A secure panel (restricted to the owner: `adityagptaa17@gmail.com` or specific roles).
*   **AuditFeed**: Logs every major action on the server (e.g., "User X logged in", "Room Y was created"). This acts as a security camera for the app.
*   **Room Management**: The admin can see all active rooms, view logs, and forcefully delete/close rooms if inappropriate behavior occurs.
*   **User Management**: View all registered users, their login devices, and lock/ban suspicious accounts.

### F. User Reviews
*   Users can navigate to `/review` and leave a 1-5 star rating and feedback.
*   This triggers an instant HTTP API call to Resend, shooting an email directly to the Admin.
*   The review is stored dynamically in the DB, visible to the user under "My Reviews" and visible to the admin on the Dashboard.

---

## 🗄️ 3. Database Models (Mongoose Schemas)

Here is exactly what the database is tracking:
1.  **`User.js`**: Stores email, hashed password, API keys, full name, 2FA settings, and preferences.
2.  **`Room.js`**: Stores the unique room code, creator's ID, current participants, absolute expiration time, and `isActive` boolean.
3.  **`Message.js`**: Stores the actual text/media, sender's ID, the room ID it belongs to, and reactions (emoji array).
4.  **`LoginSession.js`**: Stores device type, browser, location, IP address, and login time. Crucial for security audits.
5.  **`AuditLog.js`**: The system's memory. Creates records like `TARGET: 'ROOM', ACTION: 'CREATED', DETAILS: '...'`.
6.  **`Review.js`**: Stores rating out of 5, category (bug/feature request), message, and whether the admin has read it.

---

## ⚡ 4. Key Functions to Know

*   **`authController.js -> googleCallback`**: Handles the entire flow when someone clicks "Sign in with Google." Finds/creates the user, issues JWT tokens, sends the welcome email for first-timers, and redirects them to the authenticated state.
*   **`emailService.js -> sendEmail`**: Connects to the **Resend API**. You pass it a target email, a subject line, and an HTML template, and it delivers it cleanly bypassing Gmail's strict SMTP blocking.
*   **`ChatRoom.jsx -> startCall()`**: The function triggered by the green Video button. It requests camera/mic access from the browser and fires the `call-user` socket event to initiate WebRTC.

## 🚀 5. Deployment Flow
*   **Frontend (Vercel)**: Anytime code is pushed to the `main` branch of GitHub, Vercel automatically detects the change, runs `npm run build`, and updates the live UI.
*   **Backend (Render)**: Render runs a Node.js process 24/7. When code is pushed, it restarts the server, reads all environment variables (like MongoDB URI, Resend Secret), and connects the Express APIs and Socket server to the world.

---

## 💡 6. Future Enhancements (Making ROOMS Outstanding)

Here are the top features you can add to take ROOMS from a great project to an **outstanding, production-grade application**:

### A. Advanced Chat & Collaboration
*   **Message Threads & Replies**: Allow users to reply to specific messages to keep conversations organized in busy rooms.
*   **Voice Notes / Audio Messages**: Let users record and send quick audio snippets instead of just typing.
*   **Message Editing & Deletion**: Add the ability to edit typos or delete messages (with a "Deleted" tombstone).
*   **Screen Sharing**: Expand the WebRTC implementation so users can share their screen during a video call.
*   **Collaborative Whiteboard**: Integrate a real-time canvas where users in the room can draw or paste ideas together.

### B. Security & Privacy
*   **End-to-End Encryption (E2EE)**: Currently, messages go through the server. Implementing E2EE using the Signal Protocol or WebCrypto API would make the rooms truly zero-knowledge and highly secure.
*   **Disappearing Messages**: A toggle inside a room that makes all messages auto-destruct 10 seconds after they are read.
*   **Password-Protected Rooms**: Introduce a second layer of security where a room code requires an additional PIN to enter.

### C. Artificial Intelligence Integrations
*   **AI Chat Summarization**: Use an LLM (like Gemini or OpenAI) to generate a bullet-point summary of the room's conversation just before it expires.
*   **Real-time Translation**: Detect message languages and allow users to auto-translate messages into their native language instantly.
*   **Toxic Content Filter**: Implement an AI middleware that automatically hides or flags hateful, toxic, or highly inappropriate messages.

### D. User Experience (UX) & Polish
*   **Read Receipts**: Upgrade the current "Sent/Read" to show exactly *who* in a group room has read the message (like WhatsApp or Telegram).
*   **Push Notifications (PWA)**: Turn the Vercel app into a Progressive Web App (PWA) so users can install it on their phones and receive native push notifications for new messages.
*   **Rich Link Previews**: When a user drops a URL (like a YouTube or Twitter link) in the chat, fetch its metadata and display a nice visual preview card.

---

## 📣 7. LinkedIn Post Template

*Here is a ready-to-use template you can copy and paste to share your amazing work on LinkedIn:*

Hey everyone! 👋 I’m excited to share my latest full-stack project: **ROOMS** 🚀

ROOMS is a secure, real-time communication platform I built from scratch to make private chatting and video calling seamless. It's designed with a focus on speed, privacy, and a modern user experience. 

🛠️ **Tech Stack:**
• **Frontend:** React, Tailwind CSS, Vite
• **Backend:** Node.js, Express, MongoDB
• **Real-Time:** Socket.IO & WebRTC (Peer-to-Peer Video)
• **Auth & Security:** JWT, Google OAuth 2.0, Device Tracking

✨ **Key Features:**
• 🔒 Secure, auto-expiring temporary chat rooms
• 📹 P2P Encrypted Video & Audio calling directly in the browser
• ⚡ Instant messaging with typing indicators & emoji reactions
• 🛡️ Admin Dashboard with full audit logs and active session management
• 📱 Fully responsive, mobile-first modern UI

I built this project to push my boundaries with WebSockets and WebRTC, and I'm incredibly proud of how smooth the peer-to-peer video calling turned out!

🔗 Check out the live project here: https://rooms-amber.vercel.app/
💻 Explore the code on GitHub: https://github.com/Nightkilller/ROOMS

I'd love to hear your feedback or thoughts! 👇

#WebDevelopment #ReactJS #NodeJS #WebRTC #SocketIO #MongoDB #SoftwareEngineering #PortfolioProject

---
*Created dynamically for Aditya. You can use this file as a mental map whenever you want to edit or expand the project!*
