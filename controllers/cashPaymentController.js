// controllers/cashPaymentController.js
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const { logActivity } = require('./activityController');

// إنشاء طلب دفع نقدي
exports.createCashOrder = async (req, res) => {
    const userId = req.user._id;
    
    try {
        // 1. الحصول على عربة التسوق الخاصة بالمستخدم
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');
        
        if (!cart || (cart.items.length === 0 && cart.offers.length === 0)) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // 2. حساب المبلغ الإجمالي
        let totalAmount = 0;
        
        // حساب سعر العناصر
        cart.items.forEach(item => {
            totalAmount += item.quantity * item.itemId.price;
        });
        
        // حساب سعر العروض
        cart.offers.forEach(offer => {
            totalAmount += offer.quantity * offer.offerId.price;
        });
        
        // إضافة تكاليف الشحن (50 جنيه)
        totalAmount += 50;
        
        // إضافة رسوم الاستيراد (10% من إجمالي السلع والعروض)
        totalAmount += totalAmount * 0.1;

        // 3. إنشاء الطلب
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
            paymentStatus: 'pending',
            status: 'pending'
        });

        await order.save();

        // 4. تفريغ عربة التسوق
        cart.items = [];
        cart.offers = [];
        await cart.save();

        // 5. تسجيل النشاط
        await logActivity('order_placed', userId, {
            orderId: order._id,
            amount: totalAmount,
            paymentMethod: 'cash'
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully (Cash on Delivery)',
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

// تأكيد استلام الدفع النقدي (للبائع)
exports.confirmCashPayment = async (req, res) => {
    const { orderId } = req.params;
    const sellerId = req.user._id;

    try {
        // 1. التحقق من أن البائع مسؤول عن المطعم الخاص بالطلب
        const order = await Order.findById(orderId)
            .populate('restaurantId');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const restaurant = await Restaurant.findById(order.restaurantId);
        if (!restaurant || restaurant.managedBy.toString() !== sellerId.toString()) {
            return res.status(403).json({ message: 'You are not authorized to confirm this order' });
        }

        // 2. التحقق من أن طريقة الدفع نقدية
        if (order.paymentMethod !== 'cash') {
            return res.status(400).json({ message: 'This is not a cash order' });
        }

        // 3. تحديث حالة الدفع
        order.paymentStatus = 'paid';
        order.status = 'preparing'; // تغيير حالة الطلب إلى "يتم التحضير"
        await order.save();

        // 4. تحديث رصيد المطعم (إذا كان النظام يحتفظ برصيد)
        restaurant.balance += order.totalAmount;
        await restaurant.save();

        // 5. تسجيل النشاط
        await logActivity('cash_payment_confirmed', sellerId, {
            orderId: order._id,
            amount: order.totalAmount
        });

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