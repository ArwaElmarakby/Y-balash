const Order = require('../models/orderModel');
const { logActivity } = require('./activityController');
const User = require('../models/userModel');

await logActivity('order_placed', order.userId, {
    orderId: order._id,
    amount: order.totalAmount
});


exports.getOrderDetails = async (req, res) => {
    try {
        const orders = await Order.find(); // Fetch orders from the database
        const orderDetails = orders.map(order => ({
            orderId: order._id,
            customer: order.customerName,
            products: order.products,
            total: order.totalAmount,
            status: order.status,
            date: order.createdAt,
            actions: order.actions // Define actions as needed
        }));
        res.status(200).json(orderDetails);
    } catch (error) {
        res.status(500).json({ message: "Error fetching order details", error });
    }
}