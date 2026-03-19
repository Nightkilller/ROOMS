const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://adityagptaa17_db_user:Zrn70qsw1Pgm8l6w@cluster0.t7lviss.mongodb.net/rooms?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    const User = require('./models/User');
    await User.updateOne({ email: 'test@example.com' }, { $set: { isVerified: true, otp: null } });
    console.log("Verified test@example.com");
    process.exit(0);
}).catch(console.error);
