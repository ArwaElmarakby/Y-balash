const { logActivity } = require('./activityController');


await logActivity('order_placed', order.userId, {
    orderId: order._id,
    amount: order.totalAmount
});


exports.confirmCashPayment = async (req, res) => {
    const { orderId } = req.body;
    const userId = req.user._id;

    try {
        const order = await Order.findOneAndUpdate(
            { 
                _id: orderId,
                userId: userId,
                status: 'pending'
            },
            { 
                paymentMethod: 'cash',
                paymentStatus: 'pending' 
            },
            { new: true }
        ).populate('restaurantId', 'name');

        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found or already processed' 
            });
        }

        // إرسال إشعار للبائع
        await Notification.create({
            userId: order.restaurantId.managedBy, // افترضنا أن هناك حقل managedBy في موديل المطعم
            restaurantId: order.restaurantId,
            type: 'payment',
            title: 'New Cash Payment Order',
            message: `Order #${order._id} will be paid by cash`,
            relatedItem: order._id
        });

        res.status(200).json({
            success: true,
            message: 'Cash payment confirmed. Seller has been notified.',
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.completeCashPayment = async (req, res) => {
    const { orderId } = req.body;
    const sellerId = req.user._id;

    try {
        // التأكد أن الطلب تابع لمطعم البائع
        const restaurant = await Restaurant.findOne({ 
            managedBy: sellerId 
        });

        if (!restaurant) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to complete this payment'
            });
        }

        const order = await Order.findOneAndUpdate(
            { 
                _id: orderId,
                restaurantId: restaurant._id,
                paymentMethod: 'cash',
                paymentStatus: 'pending'
            },
            { 
                paymentStatus: 'completed',
                status: 'preparing' // تغيير حالة الطلب للتحضير
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or already processed'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cash payment completed successfully',
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};