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

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({ token, message: 'Login successful'  });
    } catch (error) {
        console.error("Error during login:", error); 
        res.status(500).json({ message: 'Server error' });
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




exports.requestSellerAccount = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already a seller
        if (user.isSeller) {
            return res.status(400).json({ message: 'User is already a seller' });
        }

        // Create a verification request
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        user.sellerVerification = {
            code: verificationCode,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
        };
        await user.save();

        // In a real app, you would send this to the admin email
        console.log(`Seller verification code for ${email}: ${verificationCode}`);

        res.status(200).json({ 
            message: 'Seller account request sent to admin for approval',
            email
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Admin Approve Seller
exports.adminApproveSeller = async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check verification code
        if (!user.sellerVerification || 
            user.sellerVerification.code !== parseInt(verificationCode) ||
            user.sellerVerification.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        // Generate temporary password
        const tempPassword = crypto.randomBytes(4).toString('hex');

        // Update user to seller
        user.isSeller = true;
        user.password = tempPassword;
        user.sellerVerification = undefined;
        await user.save();

        // In a real app, you would send the temp password to the seller's email
        console.log(`Temporary password for ${email}: ${tempPassword}`);

        res.status(200).json({ 
            message: 'Seller account approved',
            email,
            tempPassword // In production, don't send this in response
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Seller Login
exports.sellerLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, isSeller: true });
        if (!user) {
            return res.status(404).json({ message: 'Seller account not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({ 
            token, 
            message: 'Seller login successful',
            user: {
                email: user.email,
                isSeller: user.isSeller,
                managedRestaurant: user.managedRestaurant
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};




