const Order = require('../models/orderModel');
const { logActivity } = require('./activityController');

exports.createCashOrder = async (req, res) => {
    const { items, totalAmount, shippingAddress, restaurantId } = req.body;
    const userId = req.user._id;

    try {
        const order = new Order({
            userId,
            restaurantId,
            items,
            totalAmount,
            shippingAddress,
            paymentMethod: 'cash',
            status: 'pending',
            paymentStatus: 'pending'
        });

        await order.save();

        await logActivity('order_placed', userId, {
            orderId: order._id,
            amount: totalAmount,
            paymentMethod: 'cash'
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully (Cash on Delivery)',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
};

exports.confirmCashPayment = async (req, res) => {
    const { orderId } = req.body;
    const sellerId = req.user._id;

    try {
        const order = await Order.findOne({
            _id: orderId,
            restaurantId: req.user.managedRestaurant
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or not under your management'
            });
        }

        if (order.paymentMethod !== 'cash') {
            return res.status(400).json({
                success: false,
                message: 'This is not a cash order'
            });
        }

        order.paymentStatus = 'paid';
        await order.save();

        await logActivity('cash_payment_confirmed', sellerId, {
            orderId: order._id,
            amount: order.totalAmount
        });

        res.status(200).json({
            success: true,
            message: 'Cash payment confirmed successfully',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to confirm payment',
            error: error.message
        });
    }
};