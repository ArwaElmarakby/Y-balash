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

module.exports = router;