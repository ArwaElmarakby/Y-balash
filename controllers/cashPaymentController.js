const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const { logActivity } = require('./activityController');

exports.createCashOrder = async (req, res) => {
    const userId = req.user._id;

    try {
        // 1. جلب سلة التسوق الخاصة بالمستخدم
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');

        if (!cart || (cart.items.length === 0 && cart.offers.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'No items found in your cart'
            });
        }

        // 2. حساب المبلغ الإجمالي (يمكنك استخدام الدالة الموجودة في cartController)
        let totalAmount = 0;
        
        // حساب العناصر العادية
        cart.items.forEach(item => {
            totalAmount += item.quantity * item.itemId.price;
        });
        
        // حساب العروض إذا وجدت
        cart.offers.forEach(offer => {
            totalAmount += offer.quantity * offer.offerId.price;
        });

        // 3. الحصول على restaurantId من أول منتج في السلة
        // (يفترض أن كل المنتجات تابعة لنفس المطعم)
        const restaurantId = cart.items[0]?.itemId?.restaurant || 
                            cart.offers[0]?.offerId?.restaurant;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Could not determine restaurant for this order'
            });
        }

        // 4. إنشاء الطلب
        const order = new Order({
            userId,
            restaurantId,
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
            status: 'pending',
            paymentStatus: 'pending'
        });

        await order.save();

        // 5. تفريغ سلة التسوق بعد إنشاء الطلب
        cart.items = [];
        cart.offers = [];
        await cart.save();

        await logActivity('order_placed', userId, {
            orderId: order._id,
            amount: totalAmount,
            paymentMethod: 'cash'
        });

        res.status(201).json({
            success: true,
            message: 'Order created successfully from your cart',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create order from cart',
            error: error.message
        });
    }
};