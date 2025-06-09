const { logActivity } = require('./activityController');


await logActivity('order_placed', order.userId, {
    orderId: order._id,
    amount: order.totalAmount
});