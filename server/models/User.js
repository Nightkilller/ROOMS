const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isLocked: { type: Boolean, default: false },
    lockUntil: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    twoFactorEnabled: { type: Boolean, default: false },
    googleId: { type: String, default: null },
    firebaseUid: { type: String, default: null },
    otpHash: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    otpBlockedUntil: { type: Date, default: null },
    resetSessionToken: { type: String, default: null },
    resetSessionExpires: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
});

userSchema.methods.isOtpBlocked = function () {
    return this.otpBlockedUntil && this.otpBlockedUntil > new Date();
};

userSchema.methods.isAccountLocked = function () {
    if (this.isLocked && this.lockUntil && this.lockUntil > new Date()) return true;
    if (this.isLocked && this.lockUntil && this.lockUntil <= new Date()) {
        this.isLocked = false;
        this.lockUntil = null;
        this.failedLoginAttempts = 0;
        this.save();
        return false;
    }
    return false;
};

module.exports = mongoose.model('User', userSchema);
