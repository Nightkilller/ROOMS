require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const User = require('../models/User');

        const email = 'adityagptaa17@gmail.com';

        const existing = await User.findOne({ email });
        if (existing) {
            // If found but not admin, upgrade it
            if (existing.role !== 'admin') {
                existing.role = 'admin';
                existing.passwordHash = await bcrypt.hash('Qwerty17@', 12);
                existing.isVerified = true;
                await existing.save();
                console.log('✅ Existing account upgraded to admin!');
            } else {
                // Already admin — just update password
                existing.passwordHash = await bcrypt.hash('Qwerty17@', 12);
                existing.isVerified = true;
                await existing.save();
                console.log('✅ Admin password updated!');
            }
            console.log('   Email:', email);
            console.log('   Password: Qwerty17@');
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash('Qwerty17@', 12);
        await User.create({
            fullName: 'Aditya (Admin)',
            email,
            passwordHash,
            isVerified: true,
            role: 'admin',
        });

        console.log('✅ Admin created!');
        console.log('   Email:', email);
        console.log('   Password: Qwerty17@');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seed();
