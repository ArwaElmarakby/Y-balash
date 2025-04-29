const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
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



router.get('/orders', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to you yet' });
        }

        const orders = await Order.find({ restaurantId: seller.managedRestaurant })
            .populate('userId', 'email phone')
            .populate('items.itemId', 'name price imageUrl')
            .sort({ createdAt: -1 }); 

        res.status(200).json({
            restaurant: seller.managedRestaurant,
            totalOrders: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.put('/orders/:orderId/status', authMiddleware, sellerMiddleware, async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            message: 'Invalid status',
            validStatuses
        });
    }

    try {
        const order = await Order.findOneAndUpdate(
            { 
                _id: orderId,
                restaurantId: req.user.managedRestaurant 
            },
            { status },
            { new: true }
        ).populate('userId', 'email phone');

        if (!order) {
            return res.status(404).json({ 
                message: 'Order not found or not under your management' 
            });
        }

        res.status(200).json({ 
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.post('/products', authMiddleware, sellerMiddleware, async (req, res) => {
    const { name, price, quantity, description } = req.body;
    const seller = req.user;

    if (!seller.managedRestaurant) {
        return res.status(403).json({ 
            message: 'You must be assigned to a restaurant to add products' 
        });
    }

    if (!name || !price || !quantity) {
        return res.status(400).json({ 
            message: 'Name, price and quantity are required' 
        });
    }

    try {
        const newProduct = new Image({
            name,
            price,
            quantity,
            description: description || '',
            restaurant: seller.managedRestaurant
        });

        await newProduct.save();

        res.status(201).json({
            message: 'Product added successfully',
            product: newProduct
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/stats', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                message: 'No restaurant assigned to you yet' 
            });
        }


        const totalOrders = await Order.countDocuments({ 
            restaurantId: seller.managedRestaurant 
        });

        const pendingOrders = await Order.countDocuments({ 
            restaurantId: seller.managedRestaurant,
            status: 'pending'
        });

        const completedOrders = await Order.countDocuments({ 
            restaurantId: seller.managedRestaurant,
            status: 'delivered'
        });


        const totalProducts = await Image.countDocuments({
            restaurant: seller.managedRestaurant
        });

        res.status(200).json({
            restaurant: seller.managedRestaurant,
            stats: {
                totalOrders,
                pendingOrders,
                completedOrders,
                completionRate: totalOrders > 0 
                    ? Math.round((completedOrders / totalOrders) * 100) 
                    : 0,
                totalProducts
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});





router.get('/monthly-earnings', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to you' });
        }

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        
        const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
        const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);


        const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfLastMonth = new Date(currentYear, currentMonth, 0);


        const [currentMonthEarnings, lastMonthEarnings] = await Promise.all([
            Order.aggregate([
                { 
                    $match: { 
                        restaurantId: seller.managedRestaurant,
                        createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
                        status: 'delivered' 
                    }
                },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]),
            Order.aggregate([
                { 
                    $match: { 
                        restaurantId: seller.managedRestaurant,
                        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                        status: 'delivered'
                    }
                },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ])
        ]);


        const currentEarnings = currentMonthEarnings[0]?.total || 0;
        const lastEarnings = lastMonthEarnings[0]?.total || 0;


        let percentageChange = 0;
        if (lastEarnings > 0) {
            percentageChange = ((currentEarnings - lastEarnings) / lastEarnings) * 100;
        } else if (currentEarnings > 0) {
            percentageChange = 100; 
        }

        res.status(200).json({
            message: 'Monthly earnings retrieved successfully',
            earnings: {
                currentMonth: {
                    total: currentEarnings,
                    currency: 'EGP' 
                },
                lastMonth: {
                    total: lastEarnings,
                    currency: 'EGP'
                },
                percentageChange: percentageChange.toFixed(2) + '%'
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.get('/low-stock-count', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to you' });
        }

        const LOW_STOCK_THRESHOLD = 12; 

        const lowStockItemsCount = await Image.countDocuments({
            restaurant: seller.managedRestaurant,
            quantity: { $lte: LOW_STOCK_THRESHOLD }
        });

        res.status(200).json({
            message: 'Low stock items count retrieved successfully',
            lowStockItemsCount,
            threshold: LOW_STOCK_THRESHOLD
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


module.exports = router;