const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Image = require('../models/imageModel');

exports.getOrderDetails = async (req, res) => {
    try {
        // التحقق من أن البائع لديه مطعم معين
        if (!req.user.managedRestaurant) {
            return res.status(400).json({ 
                success: false,
                message: 'No restaurant assigned to you' 
            });
        }

        // استعلام أكثر أماناً مع التحقق من النموذج
        const orders = await Order.find({
            restaurantId: req.user.managedRestaurant
        })
        .populate({
            path: 'userId',
            model: 'User', // التأكد من اسم النموذج الصحيح
            select: 'email phone'
        })
        .populate({
            path: 'items.itemId',
            model: 'Image', // التأكد من اسم النموذج الصحيح
            select: 'name price imageUrl'
        })
        .sort({ createdAt: -1 });

        // تنسيق البيانات بشكل أكثر أماناً
        const formattedOrders = orders.map(order => {
            return {
                id: order._id,
                customer: {
                    email: order.userId?.email || 'Unknown',
                    phone: order.userId?.phone || 'N/A'
                },
                products: order.items.map(item => ({
                    name: item.itemId?.name || 'Product not found',
                    price: item.itemId?.price || 0,
                    image: item.itemId?.imageUrl || '',
                    quantity: item.quantity
                })),
                total: order.totalAmount,
                status: order.status,
                date: order.createdAt.toLocaleDateString(),
                paymentMethod: order.paymentMethod,
                actions: ['view', 'update', 'cancel'] // الإجراءات المتاحة
            };
        });

        res.status(200).json({
            success: true,
            count: formattedOrders.length,
            orders: formattedOrders
        });

    } catch (error) {
        console.error("Order details error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};