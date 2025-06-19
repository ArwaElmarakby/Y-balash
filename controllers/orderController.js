const { logActivity } = require('./activityController');

// بعد إنشاء الطلب بنجاح
const restaurant = await Restaurant.findById(order.restaurantId);
restaurant.balance += order.totalAmount;
await restaurant.save();

await logActivity('order_placed', order.userId, {
    orderId: order._id,
    amount: order.totalAmount
});