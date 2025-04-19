// controllers/orderController.js
const Order = require('../models/orderModel');

exports.getOrderStatistics = async (req, res) => {
  try {
    // Get current date and previous month
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    // Get PAID orders for current month
    const currentMonthOrders = await Order.find({
      orderDate: { $gte: currentMonthStart, $lte: currentDate },
      paymentStatus: 'paid' // Only count paid orders
    });

    // Get PAID orders for previous month
    const previousMonthOrders = await Order.find({
      orderDate: { $gte: previousMonthStart, $lte: previousMonthEnd },
      paymentStatus: 'paid' // Only count paid orders
    });

    // Calculate totals
    const currentMonthTotal = currentMonthOrders.length;
    const previousMonthTotal = previousMonthOrders.length;

    // Calculate percentage change
    let percentageChange = 0;
    if (previousMonthTotal > 0) {
      percentageChange = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
    } else if (currentMonthTotal > 0) {
      percentageChange = 100; // No previous orders, but we have current orders
    }

    // Prepare response
    const response = {
      totalOrders: currentMonthTotal,
      percentageChange: percentageChange.toFixed(2)
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting order statistics:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};