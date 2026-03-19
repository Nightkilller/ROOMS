const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(null, false, { message: 'No email from Google' });

                let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

                if (user) {
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        user.isVerified = true;
                        if (!user.fullName) user.fullName = profile.displayName;
                        await user.save();
                    }
                } else {
                    user = await User.create({
                        fullName: profile.displayName,
                        email,
                        googleId: profile.id,
                        isVerified: true,
                        passwordHash: '',
                    });
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
