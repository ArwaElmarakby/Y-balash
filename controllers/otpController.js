// const Otp = require('../models/otpModel');
// const User = require('../models/userModel');
// const sendOtp = require('../utils/sendOtp');

// exports.sendOtp = async (req, res) => {
//     const { phone } = req.body;

//     try {
//         console.log('Request received with phone:', phone);
        
//         const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//         console.log('Generated OTP:', otpCode);

//         const otp = new Otp({
//             phone,
//             code: otpCode,
//             expiresAt: Date.now() + 10 * 60 * 1000, 
//         });

//         await otp.save();
//         console.log('OTP saved to database.');

//         await sendOtp(phone, otpCode);
//         res.status(200).json({ message: 'OTP sent successfully' });
//     } catch (error) {
//         console.error('Error in sendOtp:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };


// exports.verifyOtp = async (req, res) => {
//     const { phone, code } = req.body;

//     try {
//         const otp = await Otp.findOne({ phone, code });
//         if (!otp || otp.expiresAt < Date.now()) {
//             return res.status(400).json({ message: 'Invalid or expired OTP' });
//         }

//         await Otp.deleteMany({ phone }); 
//         res.status(200).json({ message: 'OTP verified successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// };











const Otp = require('../models/otpModel');
const User = require('../models/userModel');
const sendOtp = require('../utils/sendOtp');

exports.sendOtp = async (req, res) => {
    const { phone } = req.body;

    try {
        console.log('Request received with phone:', phone);
        
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('Generated OTP:', otpCode);

        const otp = new Otp({
            phone,
            code: otpCode,
            expiresAt: Date.now() + 10 * 60 * 1000, 
        });

        await otp.save();
        console.log('OTP saved to database.');

        await sendOtp(phone, otpCode);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error in sendOtp:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.verifyOtp = async (req, res) => {
    const { phone, code } = req.body;

    try {
        const otp = await Otp.findOne({ phone, code });
        if (!otp || otp.expiresAt < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        await Otp.deleteMany({ phone }); 
        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};








