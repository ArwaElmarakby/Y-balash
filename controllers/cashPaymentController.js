const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const { createNotification } = require('./notificationController');

// إنشاء طلب دفع نقدي
exports.createCashOrder = async (req, res) => {
    const userId = req.user._id;

    try {
        // الحصول على عربة التسوق
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');

        if (!cart || (cart.items.length === 0 && cart.offers.length === 0)) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // حساب المبلغ الإجمالي
        let totalAmount = 0;
        
        // حساب سعر العناصر
        cart.items.forEach(item => {
            totalAmount += item.quantity * parseFloat(item.itemId.price);
        });

        // حساب سعر العروض
        cart.offers.forEach(offer => {
            totalAmount += offer.quantity * parseFloat(offer.offerId.price);
        });

        // إضافة تكاليف الشحن والضرائب (يمكن تعديلها حسب احتياجاتك)
        const shippingCost = 50;
        const importCharges = totalAmount * 0.1;
        totalAmount += shippingCost + importCharges;

        // إنشاء الطلب
        const order = new Order({
            restaurantId: cart.items[0]?.itemId?.restaurant || cart.offers[0]?.offerId?.restaurant,
            userId,
            items: cart.items.map(item => ({
                itemId: item.itemId._id,
                quantity: item.quantity,
                price: item.itemId.price
            })),
            offers: cart.offers.map(offer => ({
                offerId: offer.offerId._id,
                quantity: offer.quantity,
                price: offer.offerId.price
            })),
            totalAmount,
            paymentMethod: 'cash',
            isCashPaid: false
        });

        await order.save();

        // إرسال إشعار للبائع
        await createNotification(
            'cash_payment',
            order.restaurantId,
            {
                orderId: order._id,
                amount: order.totalAmount,
                message: 'New cash payment order received'
            }
        );

        // تفريغ عربة التسوق
        await Cart.findOneAndDelete({ userId });

        res.status(201).json({
            success: true,
            message: 'Cash order created successfully',
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating cash order',
            error: error.message
        });
    }
};

// تأكيد استلام الدفع النقدي من البائع
exports.confirmCashPayment = async (req, res) => {
    const { orderId } = req.params;
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
                message: 'This is not a cash payment order'
            });
        }

        if (order.isCashPaid) {
            return res.status(400).json({
                success: false,
                message: 'Payment already confirmed'
            });
        }

        order.isCashPaid = true;
        order.status = 'preparing'; // تغيير حالة الطلب إلى "يتم التحضير"
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Cash payment confirmed successfully',
            order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error confirming cash payment',
            error: error.message
        });
    }
};

// الحصول على الطلبات النقدية للبائع
exports.getCashOrders = async (req, res) => {
    const sellerId = req.user._id;

    try {
        if (!req.user.managedRestaurant) {
            return res.status(400).json({
                success: false,
                message: 'No restaurant assigned to you'
            });
        }

        const cashOrders = await Order.find({
            restaurantId: req.user.managedRestaurant,
            paymentMethod: 'cash',
            isCashPaid: false
        }).populate('userId', 'email phone');

        res.status(200).json({
            success: true,
            count: cashOrders.length,
            orders: cashOrders
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching cash orders',
            error: error.message
        });
    }
};