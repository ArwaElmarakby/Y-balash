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
        // 1. الحصول على عربة التسوق مع تفاصيل المنتجات
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId', 'price name')
            .populate('offers.offerId', 'price name');
        
        if (!cart || (cart.items.length === 0 && cart.offers.length === 0)) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // 2. تحضير العناصر والعروض للطلب
        const orderItems = cart.items.map(item => {
            // تحويل السعر من "150 EGP" إلى 150
            const price = parseFloat(item.itemId.price.toString().replace(/[^\d.]/g, ''));
            return {
                itemId: item.itemId._id,
                name: item.itemId.name,
                quantity: item.quantity,
                price: price
            };
        });

        const orderOffers = cart.offers.map(offer => {
            // تحويل السعر من "150 EGP" إلى 150
            const price = parseFloat(offer.offerId.price.toString().replace(/[^\d.]/g, ''));
            return {
                offerId: offer.offerId._id,
                name: offer.offerId.name,
                quantity: offer.quantity,
                price: price
            };
        });

        // 3. حساب المبلغ الإجمالي
        let itemsTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let offersTotal = orderOffers.reduce((sum, offer) => sum + (offer.price * offer.quantity), 0);
        let subtotal = itemsTotal + offersTotal;
        
        // إضافة تكاليف الشحن (50 جنيه)
        const shippingCost = 50;
        
        // إضافة رسوم الاستيراد (10% من إجمالي السلع والعروض)
        const importCharges = subtotal * 0.1;
        
        const totalAmount = subtotal + shippingCost + importCharges;

        // 4. إنشاء الطلب
        const order = new Order({
            userId,
            restaurantId: cart.items[0]?.itemId?.restaurant || cart.offers[0]?.offerId?.restaurant,
            items: orderItems,
            offers: orderOffers,
            totalAmount,
            paymentMethod: 'cash',
            paymentStatus: 'pending',
            status: 'pending'
        });

        await order.save();

        // 5. تفريغ عربة التسوق
        cart.items = [];
        cart.offers = [];
        await cart.save();

        res.status(201).json({
            success: true,
            message: 'Order created successfully (Cash on Delivery)',
            order: {
                _id: order._id,
                totalAmount: order.totalAmount,
                items: order.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                offers: order.offers.map(offer => ({
                    name: offer.name,
                    quantity: offer.quantity,
                    price: offer.price
                })),
                paymentMethod: order.paymentMethod,
                status: order.status
            }
        });

    } catch (error) {
        console.error('Error creating cash order:', error);
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