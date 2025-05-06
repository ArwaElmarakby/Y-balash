// const User = require('../models/userModel');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

// exports.signUp = async (req, res) => {
//     const { email, phone, password, confirmPassword } = req.body;
//     if (password !== confirmPassword) {
//         return res.status(400).json({ message: 'Passwords do not match' });
//     }

//     try {
//         const userExists = await User.findOne({ email });
//         if (userExists) {
//             return res.status(400).json({ message: 'Email already exists' });
//         }

//         const user = new User({ email, phone, password });
//         await user.save();
//         res.status(201).json({ message: 'User registered successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error' });
//     }
// };

// exports.login = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//         res.status(200).json({ token });
//     } catch (error) {
//         console.error("Error during login:", error); 
//         res.status(500).json({ message: 'Server error' });
//     }
// };


















const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signUp = async (req, res) => {
    const { email, phone, password, confirmPassword } = req.body;

    // Regular expression to validate email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|icloud\.com)$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const user = new User({ email, phone, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt with:', email); // لأغراض debugging

    try {
        // خاصية المسؤول السري
        if (email === 'yabalash001@gmail.com') {
            console.log('Admin login detected'); // debugging
            
            let user = await User.findOne({ email });
            
            // إذا لم يكن المسؤول موجوداً في قاعدة البيانات
            if (!user) {
                console.log('Admin not found, creating new admin...'); // debugging
                try {
                    const hashedPassword = await bcrypt.hash('@Yy123456', 10);
                    user = new User({
                        email: 'yabalash001@gmail.com',
                        phone: '01000000000',
                        password: hashedPassword,
                        isAdmin: true,
                        isVerified: true
                    });
                    await user.save();
                    console.log('New admin created successfully'); // debugging
                } catch (createError) {
                    console.error('Error creating admin:', createError);
                    return res.status(500).json({ message: 'Error creating admin account' });
                }
            }

            // التحقق من كلمة المرور
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // إنشاء التوكن
            const token = jwt.sign(
                { id: user._id, isAdmin: true }, 
                process.env.JWT_SECRET || 'fallback_secret', 
                { expiresIn: '30d' }
            );
            
            return res.status(200).json({
                token,
                message: 'Admin login successful',
                user: {
                    _id: user._id,
                    email: user.email,
                    isAdmin: true
                }
            });
        }

        // باقي الكود للمستخدمين العاديين...
        
    } catch (error) {
        console.error("Full login error:", error); // سجل الخطأ الكامل
        res.status(500).json({ 
            message: 'Server error',
            error: error.message // أرسل رسالة الخطأ للعميل لأغراض debugging
        });
    }
};

exports.changePassword = async (req, res) => {
    const { email, newPassword, confirmNewPassword } = req.body;

    // Check if new passwords match
    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the password
        user.password = newPassword; // Note: This will be hashed in the pre-save hook
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: 'Server error' });
    }
};








