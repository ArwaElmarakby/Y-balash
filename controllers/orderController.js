const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const { logActivity } = require('./activityController');


await logActivity('order_placed', order.userId, {
    orderId: order._id,
    amount: order.totalAmount
});


exports.createOrder = async (req, res) => {
    const { paymentMethod } = req.body; // 'cash' or 'card'
    const userId = req.user._id;

    try {
        // Get user's cart
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');

        if (!cart || (cart.items.length === 0 && cart.offers.length === 0)) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calculate total amount
        let totalAmount = 0;
        
        // Calculate items total
        cart.items.forEach(item => {
            totalAmount += item.quantity * item.itemId.price;
        });

        // Calculate offers total
        cart.offers.forEach(offer => {
            totalAmount += offer.quantity * offer.offerId.price;
        });

        // Add shipping and taxes if needed
        const shippingCost = 50;
        const taxes = totalAmount * 0.1;
        totalAmount += shippingCost + taxes;

        // Create order
        const order = new Order({
            userId,
            restaurantId: cart.items[0]?.itemId?.restaurant || cart.offers[0]?.offerId?.restaurant,
            items: cart.items.map(item => ({
                itemId: item.itemId._id,
                quantity: item.quantity,
                price: item.itemId.price
            })),
            totalAmount,
            paymentMethod: paymentMethod || 'card',
            paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid'
        });

        await order.save();

        // Clear the cart
        await Cart.findOneAndDelete({ userId });

        // Log activity
        await logActivity('order_placed', userId, {
            orderId: order._id,
            amount: totalAmount,
            paymentMethod
        });

        res.status(201).json({
            message: 'Order created successfully',
            order
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Error creating order',
            error: error.message 
        });
    }
};


exports.confirmCashPayment = async (req, res) => {
    const { orderId } = req.params;
    const sellerId = req.user._id;

    try {
        // Find the order
        const order = await Order.findOne({
            _id: orderId,
            restaurantId: req.user.managedRestaurant,
            paymentMethod: 'cash',
            paymentStatus: 'pending'
        });

        if (!order) {
            return res.status(404).json({ 
                message: 'Order not found or already confirmed' 
            });
        }

        // Update payment status
        order.paymentStatus = 'confirmed';
        await order.save();

        // Log activity
        await logActivity('payment_confirmed', sellerId, {
            orderId: order._id,
            amount: order.totalAmount
        });

        res.status(200).json({
            message: 'Cash payment confirmed successfully',
            order
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Error confirming payment',
            error: error.message 
        });
    }
};