const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const generateOTP = () => {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
};

const hashOTP = async (otp) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
};

const verifyOTP = async (otp, hash) => {
    return bcrypt.compare(otp, hash);
};

module.exports = { generateOTP, hashOTP, verifyOTP };
