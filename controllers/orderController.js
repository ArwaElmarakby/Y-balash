const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const { logActivity } = require('./activityController');

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
            totalAmount += item.quantity * item.itemId.price;
        });
        
        // حساب سعر العروض
        cart.offers.forEach(offer => {
            totalAmount += offer.quantity * offer.offerId.price;
        });
        
        // إضافة تكاليف الشحن والضرائب
        const shippingCost = 50;
        const importCharges = totalAmount * 0.1;
        totalAmount += shippingCost + importCharges;

        // إنشاء الطلب
        const order = new Order({
            userId,
            restaurantId: cart.items[0]?.itemId?.restaurant || cart.offers[0]?.offerId?.restaurant,
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
            status: 'pending'
        });

        await order.save();

        // تفريغ عربة التسوق
        await Cart.findOneAndDelete({ userId });

        // تسجيل النشاط
        await logActivity('order_placed', userId, {
            orderId: order._id,
            amount: totalAmount,
            paymentMethod: 'cash'
        });

        res.status(201).json({
            message: 'Cash order created successfully',
            order
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Error creating cash order',
            error: error.message 
        });
    }
};

exports.confirmCashPayment = async (req, res) => {
    const { orderId } = req.params;
    const sellerId = req.user._id;

    try {
        // البحث عن الطلب
        const order = await Order.findById(orderId)
            .populate('restaurantId');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // التحقق من أن البائع هو المسؤول عن المطعم
        if (order.restaurantId._id.toString() !== req.user.managedRestaurant.toString()) {
            return res.status(403).json({ message: 'Not authorized to confirm this order' });
        }

        // التحقق من أن الطلب مدفوع نقداً
        if (order.paymentMethod !== 'cash') {
            return res.status(400).json({ message: 'This is not a cash order' });
        }

        // تحديث حالة الطلب
        order.isCashPaid = true;
        order.cashPaymentConfirmedAt = new Date();
        order.status = 'preparing'; // يمكنك تغيير الحالة حسب سير العمل لديك
        
        await order.save();

        // تسجيل النشاط
        await logActivity('cash_payment_confirmed', sellerId, {
            orderId: order._id,
            amount: order.totalAmount
        });

        res.status(200).json({
            message: 'Cash payment confirmed successfully',
            order
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Error confirming cash payment',
            error: error.message 
        });
    }
};


await logActivity('order_placed', order.userId, {
    orderId: order._id,
    amount: order.totalAmount
});