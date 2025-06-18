const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const { authMiddleware } = require('./authRoutes');



function parsePrice(priceStr) {
    if (typeof priceStr === 'number') return priceStr;
    if (typeof priceStr !== 'string') return 0;
    
    // إزالة أي أحرف غير رقمية باستثناء النقطة للكسور العشرية
    const numericValue = parseFloat(priceStr.replace(/[^\d.]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
}


// إنشاء طلب دفع كاش
router.post('/create-cash-order', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');
        
        if (!cart || (cart.items.length === 0 && cart.offers.length === 0)) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        let totalAmount = 0;
        
        // معالجة العناصر
        const orderItems = cart.items.map(item => {
            const price = parsePrice(item.itemId.price);
            totalAmount += item.quantity * price;
            return {
                itemId: item.itemId._id,
                quantity: item.quantity,
                price: price
            };
        });
        
        // معالجة العروض (إذا كانت موجودة)
        if (cart.offers && cart.offers.length > 0) {
            cart.offers.forEach(offer => {
                const price = parsePrice(offer.offerId.price);
                totalAmount += offer.quantity * price;
            });
        }

        // إضافة مصاريف إضافية
        totalAmount += 50; // مصاريف شحن
        totalAmount += totalAmount * 0.1; // ضريبة 10%

        // إنشاء الطلب
        const order = new Order({
            userId,
            restaurantId: cart.items[0]?.itemId?.restaurant || cart.offers[0]?.offerId?.restaurant,
            items: orderItems,
            totalAmount,
            paymentMethod: 'cash',
            status: 'waiting_payment',
            paymentStatus: 'pending'
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
        console.error('Error in create-cash-order:', error);
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