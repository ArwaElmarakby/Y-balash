// controllers/orderController.js
const Order = require('../models/orderModel');
const Image = require('../models/imageModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');

exports.getRecentOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 }) 
            .limit(10) 
            .populate({
                path: 'items.itemId',
                select: 'name price imageUrl' 
            })
            .populate({
                path: 'userId',
                select: 'email' 
            });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: 'No orders found' });
        }

        
        const formattedOrders = orders.map(order => ({
            orderId: order._id,
            userEmail: order.userId.email, 
            items: order.items.map(item => ({
                name: item.itemId.name,
                price: item.itemId.price,
                imageUrl: item.itemId.imageUrl,
                quantity: item.quantity
            })),
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
        }));

        res.status(200).json(formattedOrders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params; 
    const { status } = req.body; 


    if (!['Pending', 'Shipped'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value. It must be either "Pending" or "Shipped".' });
    }

    try {

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true } 
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};