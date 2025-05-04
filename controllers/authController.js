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




exports.sellerLogin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const seller = await User.findOne({ 
            email: username,
            isSeller: true 
        });

        if (!seller) {
            return res.status(404).json({ message: 'Seller account not found' });
        }

        const isMatch = await bcrypt.compare(password, seller.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: seller._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        res.status(200).json({ 
            token,
            message: 'Seller login successful',
            seller: {
                id: seller._id,
                email: seller.email,
                managedRestaurant: seller.managedRestaurant
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


exports.createSellerAccount = async (req, res) => {
    const { email, restaurantId } = req.body;
    const adminId = req.user._id;

    try {

        const admin = await User.findById(adminId);
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ message: 'Only admins can create seller accounts' });
        }


        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }


        const tempPassword = crypto.randomBytes(4).toString('hex');
        

        const newSeller = new User({
            email,
            password: tempPassword,
            isSeller: true,
            managedRestaurant: restaurantId
        });

        await newSeller.save();


        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your Seller Account Credentials',
            html: `
                <h2>Welcome as a Seller!</h2>
                <p>Your seller account has been created by the admin.</p>
                <p>Here are your login details:</p>
                <p><strong>Username:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                <p>Please login and change your password immediately.</p>
                <a href="${process.env.SELLER_LOGIN_URL}">Login to Seller Dashboard</a>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: 'Seller account created and credentials sent',
            seller: {
                email: newSeller.email,
                restaurant: restaurant.name
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};





