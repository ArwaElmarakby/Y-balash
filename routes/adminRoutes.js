// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Order = require('../models/orderModel');
const { authMiddleware } = require('./authRoutes'); // Use your existing auth middleware
const adminMiddleware = require('../middleware/adminMiddleware');
const mongoose = require('mongoose');



router.get('/welcome', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        const formattedDate = today.toLocaleDateString('en-US', options);

        const welcomeMessage = `Welcome back, Admin!`;
        const response = {
            message: welcomeMessage,
            date: formattedDate
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



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




router.get('/users-stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const currentDate = new Date();
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

        const totalUsers = await User.countDocuments();
        const lastMonthUsers = await User.countDocuments({
            createdAt: { $gte: lastMonthDate, $lt: currentDate }
        });

        const percentageChange = lastMonthUsers > 0 
            ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(2)
            : '0';

        res.status(200).json({
            totalUsers,
            percentageChange
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.get('/sellers-stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const currentDate = new Date();
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

        const totalSellers = await User.countDocuments({ isSeller: true });
        const lastMonthSellers = await User.countDocuments({
            isSeller: true,
            createdAt: { $gte: lastMonthDate, $lt: currentDate }
        });

        const percentageChange = lastMonthSellers > 0 
            ? ((totalSellers - lastMonthSellers) / lastMonthSellers * 100).toFixed(2)
            : totalSellers > 0 ? '100.00' : '0.00';

        res.status(200).json({
            totalSellers,
            percentageChange
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.get('/orders-stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const currentDate = new Date();
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

        const totalOrders = await Order.countDocuments();
        const lastMonthOrders = await Order.countDocuments({
            createdAt: { $gte: lastMonthDate, $lt: currentDate }
        });

        const percentageChange = lastMonthOrders > 0 
            ? ((totalOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(2)
            : totalOrders > 0 ? '100.00' : '0.00';

        res.status(200).json({
            totalOrders,
            percentageChange
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.get('/revenue-stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const currentDate = new Date();
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);


        const totalRevenueResult = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);


        const lastMonthRevenueResult = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastMonthDate, $lt: currentDate }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

        const totalRevenue = totalRevenueResult[0]?.total || 0;
        const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;


        let percentageChange = '0.00';
        if (lastMonthRevenue > 0) {
            percentageChange = ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(2);
        } else if (totalRevenue > 0) {
            percentageChange = '100.00';
        }

        res.status(200).json({
            totalRevenue,
            percentageChange,
            currency: "EGP"
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/revenue-30days', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const daysAgo30 = new Date();
        daysAgo30.setDate(daysAgo30.getDate() - 30);

        const dailyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: daysAgo30 }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    dailyTotal: { $sum: "$totalAmount" }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.dailyTotal, 0);
        const averageDailyRevenue = totalRevenue / 30;

        res.status(200).json({
            period: "last_30_days",
            totalRevenue,
            averageDailyRevenue,
            dailyBreakdown: dailyRevenue,
            currency: "EGP"
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.get('/revenue-12months', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const monthsAgo12 = new Date();
        monthsAgo12.setMonth(monthsAgo12.getMonth() - 12);

        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: monthsAgo12 }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    monthlyTotal: { $sum: "$totalAmount" }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        const totalRevenue = monthlyRevenue.reduce((sum, month) => sum + month.monthlyTotal, 0);
        const averageMonthlyRevenue = totalRevenue / 12;

        res.status(200).json({
            period: "last_12_months",
            totalRevenue,
            averageMonthlyRevenue,
            monthlyBreakdown: monthlyRevenue,
            currency: "EGP"
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.get('/recent-alerts', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const flaggedProducts = await Image.countDocuments({ isFlagged: true });
        const pendingSellerApprovals = await User.countDocuments({ 
            isSeller: false,
            'sellerRequest.status': 'pending'
        });
        const lowStockItems = await Image.countDocuments({ 
            quantity: { $lt: 10 } 
        });

        res.status(200).json({
            success: true,
            flaggedProducts,
            pendingSellerApprovals,
            lowStockItems,
            lastUpdated: new Date()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts data',
            errorDetails: {
                message: error.message,
                type: error.name
            },
            timestamp: new Date()
        });
    }
});



module.exports = router;