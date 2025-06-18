
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const Cart = require('../models/cartModel'); 

// exports.createPayment = async (req, res) => {
//     const userId = req.user.id; 

//     try {
      
//         const cart = await Cart.findOne({ userId }).populate('items.itemId');
//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found' });
//         }

       
//         let totalAmount = 0;
//         cart.items.forEach(item => {
//             totalAmount += item.quantity * parseFloat(item.itemId.price);
//         });

        
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: totalAmount * 100, 
//             currency: 'usd', 
//             payment_method_types: ['card'], 
//             metadata: {
//                 userId: userId, 
//             },
//         });

//         res.status(200).json({ clientSecret: paymentIntent.client_secret });
//     } catch (error) {
//         res.status(500).json({ message: 'Payment failed', error: error.message });
//     }
// };








// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const Cart = require('../models/cartModel'); 

// exports.createPayment = async (req, res) => {
//     const userId = req.user.id; 

//     try {
//         const cart = await Cart.findOne({ userId })
//             .populate('items.itemId')
//             .populate('offers.offerId');
//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found' });
//         }

//         // Calculate total items price
//         let totalItemsPrice = 0;
//         cart.items.forEach(item => {
//             totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
//         });

//         // Calculate total offers price
//         let totalOffersPrice = 0;
//         cart.offers.forEach(offer => {
//             totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
//         });

//         // Additional costs
//         const shippingCost = 50; 
//         const importCharges = (totalItemsPrice + totalOffersPrice) * 0.1; 

//         // Total price calculation
//         const totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

//         // Create payment intent with the total price
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: totalPrice * 100, // Convert to cents
//             currency: 'usd', 
//             payment_method_types: ['card'], 
//             metadata: {
//                 userId: userId, 
//             },
//         });

//         res.status(200).json({ clientSecret: paymentIntent.client_secret });
//     } catch (error) {
//         res.status(500).json({ message: 'Payment failed', error: error.message });
//     }
// };









const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Cart = require('../models/cartModel'); 
const Order = require('../models/orderModel');

exports.createPayment = async (req, res) => {
    const userId = req.user.id; 

    try {
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Calculate total items price
        let totalItemsPrice = 0;
        cart.items.forEach(item => {
            totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
        });

        // Calculate total offers price
        let totalOffersPrice = 0;
        cart.offers.forEach(offer => {
            totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
        });

        // Additional costs
        const shippingCost = 50; 
        const importCharges = totalItemsPrice / 4; // Calculate import charges as 1/4 of total items price

        // Total price calculation
        const totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

        // Create payment intent with the total price
        const amount = Math.round(totalPrice * 100);
        const paymentIntent = await stripe.paymentIntents.create({
            // amount: totalPrice * 100, // Convert to cents
            amount: amount,
            currency: 'egp', 
            payment_method_types: ['card'], 
            metadata: {
                userId: userId, 
            },
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ message: 'Payment failed', error: error.message });
    }
};

exports.createCashPayment = async (req, res) => {
    const userId = req.user._id;

    try {
        // جلب محتويات السلة
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');
        
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // حساب التكلفة الإجمالية
        let totalItemsPrice = 0;
        cart.items.forEach(item => {
            totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
        });

        let totalOffersPrice = 0;
        cart.offers.forEach(offer => {
            totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
        });

        const shippingCost = 50;
        const importCharges = totalItemsPrice / 4;
        const totalAmount = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

        // إنشاء طلب جديد
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
            totalAmount,
            paymentMethod: 'cash',
            status: 'pending_payment' // حالة جديدة للدفع النقدي
        });

        await order.save();

        // تفريغ السلة بعد إنشاء الطلب
        await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [], offers: [] } }
        );

        res.status(201).json({
            message: 'Cash payment order created successfully',
            order: {
                id: order._id,
                totalAmount,
                items: order.items,
                offers: order.offers,
                createdAt: order.createdAt
            }
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to create cash payment order',
            error: error.message 
        });
    }
};

// تأكيد الدفع النقدي من البائع
exports.confirmCashPayment = async (req, res) => {
    const { orderId } = req.params;
    const sellerId = req.user._id;

    try {
        // التأكد من أن الطلب مرتبط بمطعم البائع
        const order = await Order.findOneAndUpdate(
            { 
                _id: orderId,
                restaurantId: req.user.managedRestaurant,
                paymentMethod: 'cash',
                status: 'pending_payment'
            },
            { 
                status: 'paid',
                paymentConfirmedBy: sellerId,
                paymentConfirmedAt: new Date()
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ 
                message: 'Order not found or not eligible for confirmation' 
            });
        }

        res.status(200).json({
            message: 'Cash payment confirmed successfully',
            order: {
                id: order._id,
                status: order.status,
                totalAmount: order.totalAmount,
                paymentConfirmedAt: order.paymentConfirmedAt
            }
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to confirm cash payment',
            error: error.message 
        });
    }
};