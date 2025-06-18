const { logActivity } = require('./activityController');
const Image = require('../models/imageModel');
const Category = require('../models/categoryModel');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const axios = require('axios');
const cron = require('node-cron');
const { logActivity } = require('./activityController');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');

await logActivity('order_placed', order.userId, {
    orderId: order._id,
    amount: order.totalAmount
});

exports.createCashOrder = async (req, res) => {
    const userId = req.user._id;

    try {
        // جلب عربة التسوق
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');

        if (!cart || (cart.items.length === 0 && cart.offers.length === 0)) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // حساب المبلغ الإجمالي
        let totalItemsPrice = 0;
        cart.items.forEach(item => {
            totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
        });

        let totalOffersPrice = 0;
        cart.offers.forEach(offer => {
            totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
        });

        const shippingCost = 50;
        const importCharges = (totalItemsPrice + totalOffersPrice) * 0.1;
        const totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

        // إنشاء الطلب
        const order = new Order({
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
            totalAmount: totalPrice,
            paymentMethod: 'cash',
            paymentStatus: 'pending',
            status: 'pending'
        });

        await order.save();

        // تفريغ عربة التسوق
        await Cart.findOneAndDelete({ userId });

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

// تأكيد استلام الدفع (للبائع)
exports.confirmCashPayment = async (req, res) => {
    const { orderId } = req.params;
    const seller = req.user;

    try {
        const order = await Order.findOne({
            _id: orderId,
            restaurantId: seller.managedRestaurant,
            paymentMethod: 'cash'
        });

        if (!order) {
            return res.status(404).json({ 
                message: 'Order not found or not under your management' 
            });
        }

        order.paymentStatus = 'paid';
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
};