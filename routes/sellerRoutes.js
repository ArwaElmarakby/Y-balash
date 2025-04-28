// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');
const Restaurant = require('../models/restaurantModel');
const Image = require('../models/imageModel');
const Order = require('../models/orderModel');


router.use(authMiddleware, sellerMiddleware);


router.get('/my-restaurant', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('restaurant');
        if (!user.restaurant) {
            return res.status(404).json({ 
                success: false,
                message: 'No restaurant associated with this seller' 
            });
        }
        res.status(200).json({ 
            success: true,
            restaurant: user.restaurant 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error 
        });
    }
});


router.post('/add-item', async (req, res) => {
    const { name, price, quantity, categoryId } = req.body;
    
    try {
        const user = await User.findById(req.user._id).populate('restaurant');
        if (!user.restaurant) {
            return res.status(403).json({ 
                success: false,
                message: 'You do not have a restaurant to add items to' 
            });
        }

        const newImage = new Image({ 
            name, 
            price, 
            quantity,
            category: categoryId,
            restaurant: user.restaurant._id
        });
        
        await newImage.save();


        user.restaurant.images.push(newImage._id);
        await user.restaurant.save();

        res.status(201).json({ 
            success: true,
            message: 'Item added successfully', 
            item: newImage 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error 
        });
    }
});


router.get('/orders', async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const orders = await Order.find({ restaurantId: user.restaurant })
            .populate('userId', 'email phone')
            .populate('items.itemId', 'name price');
            
        res.status(200).json({ 
            success: true,
            orders 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error 
        });
    }
});


router.put('/orders/:orderId/status', async (req, res) => {
    const { status } = req.body;
    
    try {
        const order = await Order.findOneAndUpdate(
            { 
                _id: req.params.orderId, 
                restaurantId: req.user.restaurant 
            },
            { status },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found or not associated with your restaurant' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Order status updated', 
            order 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error 
        });
    }
});

module.exports = router;