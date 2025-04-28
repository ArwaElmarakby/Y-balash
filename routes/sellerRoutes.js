const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');


router.post('/promote-to-seller', authMiddleware, sellerMiddleware, async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isSeller = true;
        await user.save();

        res.status(200).json({ message: 'User promoted to seller successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

router.post('/add-product', authMiddleware, sellerMiddleware, (req, res) => {

    res.status(200).json({ message: 'Product added successfully (seller only)' });
});


router.post('/become-seller', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user.isSeller) {
            return res.status(400).json({ message: 'You are already a seller!' });
        }

        user.isSeller = true;
        await user.save();

        res.status(200).json({ 
            message: 'Congratulations! You are now a seller.',
            user: {
                _id: user._id,
                email: user.email,
                isSeller: true
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;