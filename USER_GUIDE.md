# 🧭 ROOMS — Complete User Guide

> **Your test environment is running. OTP codes print in the backend terminal instead of being emailed.**

---

## 🚀 Starting the App

Open **two terminals** and run:

```bash
# Terminal 1 — Backend (in-memory DB, no setup needed)
cd /Users/adityagupta/Desktop/ROOMS/server && PORT=5001 npm run dev:test

# Terminal 2 — Frontend
cd /Users/adityagupta/Desktop/ROOMS/client && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📋 Testing Every Feature — Step by Step

### 1. Register a New Account

1. Go to **http://localhost:5173/register**
2. Fill in: Full Name, Email, Password (must have 8+ chars, uppercase, number, special char), Confirm Password
3. Watch the **live password strength checker** turn green as you type
4. Click **Create Account**
5. You'll be redirected to the **Verify Email** page with 6 OTP boxes

### 2. Verify Email with OTP

1. Switch to **Terminal 1** (backend) — look for:
   ```
   ══════════════════════════════════════════════════
   📧 EMAIL (not actually sent)
   ══════════════════════════════════════════════════
     To:      your@email.com
     Subject: Verify Your ROOMS Account
     ┌─────────────────────┐
     │   OTP CODE: 123456   │
     └─────────────────────┘
   ══════════════════════════════════════════════════
   ```
2. Copy the **6-digit OTP code** from the terminal
3. Enter it in the OTP boxes on the verification page
4. ✅ You're now verified and logged in — redirected to **Dashboard**

### 3. User Dashboard

After login you'll see:
- **Welcome message** with your name
- **Quick-access cards**: My Profile, Security, Activity
- **Account Overview**: Email, Role, Verified status, 2FA status

### 4. Login (existing account)

1. Go to **http://localhost:5173/login**
2. Enter email + password
3. Optional: Check **Remember Me** for a 30-day session
4. Click **Sign In**
5. If 2FA is enabled, you'll be asked for an OTP (check terminal)

### 5. Admin Login

1. Go to **http://localhost:5173/login**
2. Use: **adityagptaa17@gmail.com** / **Qwerty17@**
3. After login, you'll see an **Admin** link in the navbar
4. You have full access to the Admin Dashboard

### 6. Forgot Password

1. Click **Forgot password?** on the login page
2. Enter your email → Click **Send OTP**
3. Check **Terminal 1** for the OTP code
4. Enter OTP on the verify page
5. Set a new password (strength checker will guide you)
6. ✅ Password reset! Login with new password

### 7. Profile Page

Click **Profile** in the navbar, you'll see:

- **Profile Info**: Name, Email, Joined date, Status
- **Two-Factor Authentication**: Enable/Disable button
  - Click Enable → Check terminal for OTP → Enter OTP → 2FA is on!
  - Next login will require an OTP after password
- **Change Password**: Enter current + new password
- **Login History**: Last 10 login sessions with device/browser/location/time
- **Logout All Devices**: Kills all sessions everywhere
- **Delete Account**: Click Delete → Confirm → Enter OTP from terminal → Account gone

### 8. Admin Dashboard

Click **Admin** in the navbar to see:

- **Live Stats Bar**: Total Users, Online Now, New Today, This Week
- **Signups Chart** (line): Last 30 days of new registrations
- **Logins Chart** (bar): Last 7 days of login activity
- **Device Chart** (pie): Desktop vs Mobile vs Tablet breakdown
- **Export Buttons**: Download PDF or CSV report of all users
- **User Management Table**:
  - Search by name or email
  - Filter by status: All / Verified / Unverified / Locked
  - Actions per user:
    - **View** → Opens detail modal (full profile + login history + admin notes)
    - **Lock** → Blocks user from logging in
    - **Unlock** → Removes lock
    - **Logout** → Force-logouts user from all devices
    - **Delete** → Permanently removes user
- **Audit Log**: Every admin action is recorded (who did what, when)

### 9. Admin → View User Detail

1. Click **View** on any user in the table
2. A modal opens showing:
   - Full profile info with verification/2FA/lock badges
   - Complete login history (every session with browser, device, location, time)
   - **Admin Notes** section — type a note and click Add

### 10. Export Data

1. On the Admin Dashboard, click **📄 Export PDF** or **📊 Export CSV**
2. A file downloads instantly with all user data
3. Exports respect the current status filter

---

## 🔑 Key Accounts for Testing

| Account | Email | Password | Role |
|---------|-------|----------|------|
| **Admin (You)** | adityagptaa17@gmail.com | Qwerty17@ | Admin |
| New User | (register one yourself) | (your password) | User |

---

## 🔔 Real-Time Login Notifications

Every time **any user logs in**, you will automatically receive an email at **adityagptaa17@gmail.com** with:

- 👤 **Name** of the user who logged in
- 📧 **Email address** of the user
- 🕐 **Login time** (Indian Standard Time)
- 💻 **Device** (Desktop/Mobile etc.)
- 🌐 **Browser** used
- 📍 **Location** (city, country)

Subject line: `🔔 ROOMS — New Login: [User Name]`

> The admin's own logins do **not** trigger a notification (to avoid spam).

---

## ⚡ Quick Reference — OTP Codes

OTP codes are **NOT emailed** in test mode. They print in the **backend terminal** (Terminal 1).

Look for the box that says:
```
│   OTP CODE: XXXXXX   │
```

OTPs are needed for:
- Email verification (after registration)
- Forgot password flow
- Two-Factor Authentication (2FA) login
- Enabling/disabling 2FA
- Deleting your account

---

## 🛑 Stopping the App

Press **Ctrl+C** in both terminals, or just close them.

---

## 🔧 Restarting After a Crash

The in-memory database resets every restart. Just run the commands again:
```bash
# Terminal 1
cd /Users/adityagupta/Desktop/ROOMS/server && PORT=5001 npm run dev:test

# Terminal 2
cd /Users/adityagupta/Desktop/ROOMS/client && npm run dev
```
The admin account is auto-seeded every time.


cd /Users/adityagupta/Desktop/ROOMS/server && npm run dev


 cd /Users/adityagupta/Desktop/ROOMS/client && npm run dev