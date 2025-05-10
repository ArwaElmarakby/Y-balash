// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Order = require('../models/orderModel');
const Image = require('../models/imageModel');
const { authMiddleware } = require('./authRoutes'); // Use your existing auth middleware
const adminMiddleware = require('../middleware/adminMiddleware');
const { getAdminAlerts } = require('../controllers/adminController');
const { getTopCategories } = require('../controllers/adminController');
const nodemailer = require('nodemailer'); 
const RejectedSeller = require('../models/rejectedSellerModel');
const { getApprovedSellers, approveSeller } = require('../controllers/adminController');
const { getPendingSellerRequests } = require('../controllers/adminController');



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


router.get('/seller/:id/details', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const seller = await User.findById(id).populate('managedRestaurant');
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }
        const totalProducts = await Image.countDocuments({ restaurant: seller.managedRestaurant._id });
        const totalOrders = await Order.countDocuments({ restaurantId: seller.managedRestaurant._id });
        const totalEarnings = await Order.aggregate([
            { $match: { restaurantId: seller.managedRestaurant._id, status: 'delivered' } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const earnings = totalEarnings[0]?.total || 0; // Get total earnings
        const rating = seller.rating || 0; // Assuming you have a rating field in the User model
        const lastActive = seller.lastActive ? seller.lastActive.toISOString() : 'Not available'; // Format the date
        res.status(200).json({
            totalProducts,
            totalOrders,
            totalEarnings: earnings,
            rating,
            lastActive
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.get('/seller/:id/products', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    
    try {

        const seller = await User.findById(id);
        if (!seller) {
            return res.status(404).json({ 
                success: false,
                message: 'Seller not found' 
            });
        }


        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                success: false,
                message: 'This seller is not assigned to any restaurant' 
            });
        }


        const products = await Image.find({ 
            restaurant: seller.managedRestaurant 
        })
        .populate('category', 'name')
        .select('name price imageUrl quantity category');


        const formattedProducts = products.map(product => ({
            id: product._id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            stock: product.quantity,
            status: product.quantity > 0 ? 'In Stock' : 'Out of Stock',
            category: product.category ? product.category.name : 'Uncategorized'
        }));

        res.status(200).json({
            success: true,
            count: formattedProducts.length,
            products: formattedProducts
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

router.get('/orders/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'email') 
            .populate('restaurantId', 'name')
            .sort({ createdAt: -1 });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'No orders found' 
            });
        }


        const formattedOrders = orders.map(order => ({
            orderId: order._id,
            clientEmail: order.userId.email,
            restaurantName: order.restaurantId.name,
            date: order.createdAt.toLocaleDateString('en-GB'), 
            totalAmount: `${order.totalAmount} EGP`, 
            status: order.status
        }));

        res.status(200).json({
            success: true,
            count: formattedOrders.length,
            orders: formattedOrders
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});



router.post('/reject-seller', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { email, reason } = req.body;
        
        // Validate input
        if (!email || !reason) {
            return res.status(400).json({ 
                success: false,
                message: "Email and rejection reason are required"
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        const rejectionRecord = new RejectedSeller({
            email,
            reason,
            adminId: req.user._id
        });
        await rejectionRecord.save();
        

        // Email setup (consider moving to a separate service)
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL, // Make sure it's defined in .env
                pass: process.env.EMAIL_PASSWORD // Make sure it's defined in .env
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Email content
        const mailOptions = {
            from: `"YaBalash Admin" <${process.env.EMAIL}>`,
            to: email,
            subject: "Your Seller Application Status",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                    <h2 style="color: #d9534f;">Your Seller Application Has Been Rejected</h2>
                    <p>Dear ${user.firstName || 'Seller'},</p>
                    <p>We regret to inform you that your seller application has been rejected for the following reason:</p>
                    <p style="background-color: #f8f9fa; padding: 10px; border-left: 3px solid #d9534f;">
                        <strong>Reason:</strong> ${reason}
                    </p>
                    <p>Please contact our support team if you have any questions.</p>
                    <hr>
                    <p>Best regards,<br>The YaBalash Team</p>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Return success
        res.status(200).json({ 
            success: true,
            message: "Seller rejected and notification sent successfully",
            data: {
                email,
                reason,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Failed to reject seller:", error);
        res.status(500).json({ 
            success: false,
            message: "An error occurred while processing your request",
            error: error.message 
        });
    }
});



router.get('/rejected-sellers', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const rejectedSellers = await RejectedSeller.find()
            .sort({ rejectedAt: -1 }); 

        res.status(200).json({
            success: true,
            count: rejectedSellers.length,
            rejectedSellers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch rejected sellers",
            error: error.message
        });
    }
});


router.get('/approved-sellers', authMiddleware, adminMiddleware, getApprovedSellers);


router.post('/approve-seller', authMiddleware, adminMiddleware, approveSeller);

router.get('/pending-seller-requests', authMiddleware, adminMiddleware, getPendingSellerRequests);

module.exports = router;