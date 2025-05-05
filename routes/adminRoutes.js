// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Order = require('../models/orderModel');
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
    const { userId, restaurantId } = req.body;

    try {
        const [user, restaurant] = await Promise.all([
            User.findById(userId),
            Restaurant.findById(restaurantId)
        ]);

        if (!user || !restaurant) {
            return res.status(404).json({ message: 'User or restaurant not found' });
        }

        user.isSeller = true;
        user.managedRestaurant = restaurantId;
        await user.save();

        res.status(200).json({ 
            message: 'Seller assigned to restaurant successfully',
            user: {
                _id: user._id,
                email: user.email,
                isSeller: true,
                managedRestaurant: restaurant.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.post('/remove-seller', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isSeller) {
            return res.status(400).json({ message: 'User is not a seller' });
        }

        user.isSeller = false;
        user.managedRestaurant = undefined;
        await user.save();

        res.status(200).json({ 
            message: 'Seller removed successfully',
            user: {
                _id: user._id,
                email: user.email,
                isSeller: false
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/sellers', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const sellers = await User.find({ isSeller: true })
            .populate('managedRestaurant', 'name imageUrl')
            .select('-password');

        res.status(200).json({
            count: sellers.length,
            sellers
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [usersCount, sellersCount, adminsCount, restaurantsCount, ordersCount] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isSeller: true }),
            User.countDocuments({ isAdmin: true }),
            Restaurant.countDocuments(),
            Order.countDocuments()
        ]);

        res.status(200).json({
            stats: {
                totalUsers: usersCount,
                totalSellers: sellersCount,
                totalAdmins: adminsCount,
                totalRestaurants: restaurantsCount,
                totalOrders: ordersCount
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.put('/toggle-user/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({ 
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user: {
                _id: user._id,
                email: user.email,
                isActive: user.isActive
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/orders', authMiddleware, adminMiddleware, async (req, res) => {
    const { status, restaurantId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (restaurantId) filter.restaurantId = restaurantId;

    try {
        const orders = await Order.find(filter)
            .populate('userId', 'email phone')
            .populate('restaurantId', 'name')
            .populate('items.itemId', 'name price')
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});




module.exports = router;