// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Order = require('../models/orderModel');
const { authMiddleware } = require('./authRoutes'); // Use your existing auth middleware
const adminMiddleware = require('../middleware/adminMiddleware');
const { getAdminAlerts } = require('../controllers/adminController');
const { getTopCategories } = require('../controllers/adminController');
const Image = require('../models/imageModel');



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



router.get('/alerts', authMiddleware, adminMiddleware, getAdminAlerts);


router.get('/top-categories', authMiddleware, adminMiddleware, getTopCategories);

router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find()
            .select('_id email createdAt isActive')
            .sort({ createdAt: -1 });

        const formattedUsers = users.map(user => {
            const joinDate = user.createdAt ? 
                new Date(user.createdAt).toISOString().split('T')[0] : 
                'N/A';
                
            return {
                id: user._id,
                email: user.email,
                joinDate: joinDate,
                status: user.isActive ? 'Active' : 'Inactive'
            };
        });

        res.status(200).json({
            success: true,
            count: formattedUsers.length,
            users: formattedUsers
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});



router.get('/sellers', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const sellers = await User.find({ isSeller: true })
            .select('_id firstName lastName email phone createdAt plan status')
            .sort({ createdAt: -1 });

        const formattedSellers = sellers.map(seller => ({
            id: seller._id,
            name: `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'No Name',
            email: seller.email,
            phone: seller.phone || 'N/A',
            joinDate: seller.createdAt ? seller.createdAt.toISOString().split('T')[0] : 'N/A',
            plan: seller.plan || 'basic',
            status: seller.status || 'pending'
        }));

        res.status(200).json({
            success: true,
            count: formattedSellers.length,
            sellers: formattedSellers
        });
    } catch (error) {
        console.error('Error fetching sellers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sellers',
            error: error.message
        });
    }
});



router.get('/sellers/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const seller = await User.findOne({
            _id: req.params.id,
            isSeller: true
        }).select('firstName lastName email phone plan status premiumExpiresAt');

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        const response = {
            id: seller._id,
            name: `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'No Name',
            email: seller.email,
            phone: seller.phone || 'N/A',
            isPremium: seller.plan === 'premium',
            status: seller.status || 'pending',
            plan: seller.plan || 'basic',
            expiresAt: seller.premiumExpiresAt ? seller.premiumExpiresAt.toISOString().split('T')[0] : 'N/A',
            daysRemaining: seller.premiumExpiresAt ? 
                Math.ceil((seller.premiumExpiresAt - new Date()) / (1000 * 60 * 60 * 24)) : 
                null
        };

        res.status(200).json({
            success: true,
            seller: response
        });
    } catch (error) {
        console.error('Error fetching seller details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching seller details',
            error: error.message
        });
    }
});

router.get('/seller-performance/:sellerId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const seller = await User.findById(req.params.sellerId)
            .select('isSeller managedRestaurant lastActive updatedAt createdAt');

        if (!seller || !seller.isSeller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found or not a seller'
            });
        }

        if (!seller.managedRestaurant) {
            return res.status(400).json({
                success: false,
                message: 'Seller has no restaurant assigned'
            });
        }

        const [productsCount, orders] = await Promise.all([
            Image.countDocuments({ restaurant: seller.managedRestaurant }),
            Order.find({ restaurantId: seller.managedRestaurant })
                .select('totalAmount status rating')
        ]);

        // حساب الإحصائيات
        const totalEarnings = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const completedOrders = orders.filter(o => o.status === 'delivered').length;
        
        // حل نهائي لمعالجة التواريخ
        const getSafeDate = () => {
            const possibleDates = [
                seller.lastActive,
                seller.updatedAt,
                seller.createdAt,
                new Date()
            ];
            return possibleDates.find(date => date instanceof Date && !isNaN(date)) || new Date();
        };

        const performanceData = {
            totalProducts: productsCount,
            totalOrders: orders.length,
            completedOrders: completedOrders,
            totalEarnings: `${totalEarnings.toFixed(2)} EGP`,
            sellerRating: calculateSellerRating(orders),
            lastActive: getSafeDate().toISOString()
        };

        res.status(200).json({
            success: true,
            performance: performanceData
        });

    } catch (error) {
        console.error('Error in seller-performance:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

function calculateSellerRating(orders) {
    try {
        const ratedOrders = orders.filter(o => o.rating && !isNaN(o.rating));
        if (ratedOrders.length === 0) return 'Not rated yet';
        
        const avgRating = ratedOrders.reduce((sum, o) => sum + o.rating, 0) / ratedOrders.length;
        return `${avgRating.toFixed(1)}/5`;
    } catch {
        return 'Rating unavailable';
    }
}



module.exports = router;