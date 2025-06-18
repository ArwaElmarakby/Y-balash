const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const { authMiddleware } = require('./authRoutes');

// إنشاء طلب دفع كاش
router.post('/create-cash-order', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // جلب عربة التسوق
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');
        
        if (!cart || (cart.items.length === 0 && cart.offers.length === 0)) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // حساب المبلغ الإجمالي
        let totalAmount = 0;
        
        if (cart.items.length > 0) {
            totalAmount += cart.items.reduce((sum, item) => {
                return sum + (item.quantity * item.itemId.price);
            }, 0);
        }
        
        if (cart.offers.length > 0) {
            totalAmount += cart.offers.reduce((sum, offer) => {
                return sum + (offer.quantity * offer.offerId.price);
            }, 0);
        }

        // إضافة مصاريف الشحن والضرائب (إذا لزم الأمر)
        totalAmount += 50; // مصاريف شحن
        totalAmount += totalAmount * 0.1; // ضريبة 10%

        // إنشاء الطلب
        const order = new Order({
            userId,
            restaurantId: cart.items[0]?.itemId?.restaurant || cart.offers[0]?.offerId?.restaurant,
            items: cart.items.map(item => ({
                itemId: item.itemId._id,
                quantity: item.quantity,
                price: item.itemId.price
            })),
            totalAmount,
            paymentMethod: 'cash',
            status: 'waiting_payment' // في انتظار الدفع
        });

        await order.save();

        // إفراغ عربة التسوق
        cart.items = [];
        cart.offers = [];
        await cart.save();

        res.status(201).json({
            message: 'Cash order created successfully. Waiting for seller confirmation.',
            order
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Error creating cash order',
            error: error.message 
        });
    }
});

// راوت لتأكيد الدفع (للبائع)
router.post('/confirm-cash-payment/:orderId', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // التحقق من أن المستخدم بائع
        const user = await User.findById(req.user._id);
        if (!user.isSeller) {
            return res.status(403).json({ message: 'Only sellers can confirm payments' });
        }

        // البحث عن الطلب
        const order = await Order.findOne({
            _id: orderId,
            restaurantId: user.managedRestaurant,
            paymentMethod: 'cash',
            paymentStatus: 'pending'
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or already paid' });
        }

        // تحديث حالة الدفع
        order.paymentStatus = 'paid';
        order.status = 'preparing'; // تغيير الحالة إلى "يتم التحضير"
        await order.save();

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
});

module.exports = router;