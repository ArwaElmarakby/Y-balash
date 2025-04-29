// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const { authMiddleware } = require('./authRoutes'); // Use your existing auth middleware
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/promote', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id; // Get the user ID from the token
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }

        // Promote user to admin
        user.isAdmin = true;
        await user.save();

        res.status(200).json({ message: 'User  promoted to admin successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.post('/assign-seller', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { sellerId, restaurantId } = req.body;


        const seller = await User.findById(sellerId);
        const restaurant = await Restaurant.findById(restaurantId);

        if (!seller || !restaurant) {
            return res.status(404).json({ message: 'Seller or Restaurant not found' });
        }


        seller.restaurant = restaurantId;
        seller.isSeller = true;
        await seller.save();

        res.status(200).json({
            message: `Seller ${seller.email} assigned to ${restaurant.name} successfully`,
            seller,
            restaurant
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;