
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
const Restaurant = require('../models/restaurantModel');

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

         await Restaurant.findByIdAndUpdate(
            cart.items[0].itemId.restaurant || cart.offers[0].offerId.restaurant,
            { $inc: { totalOrders: 1, totalRevenue: totalPrice } }
        );

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ message: 'Payment failed', error: error.message });
    }
};




exports.cashPayment = async (req, res) => {
    const userId = req.user.id;

    try {
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Retrieve restaurantId from items or offers
        let restaurantId = null;
        if (cart.items.length > 0) {
            restaurantId = cart.items[0].itemId.restaurant || null;
        } 
        if (!restaurantId && cart.offers.length > 0) {
            restaurantId = cart.offers[0].offerId.restaurant || null;
        }
        if (!restaurantId) {
            return res.status(400).json({ message: 'Unable to determine restaurant from cart items/offers' });
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

        // Create an order
        const order = new Order({
            userId: userId,
            restaurantId: restaurantId,
            items: cart.items,
            totalAmount: totalPrice,
            status: 'pending', // Set initial status to pending
        });

        await order.save();

        // Clear the cart after payment
        await Cart.deleteOne({ userId });

        await Restaurant.findByIdAndUpdate(
            restaurantId,
            { $inc: { totalOrders: 1, totalRevenue: totalPrice } }
        );

        res.status(200).json({ message: 'Cash payment initiated successfully', orderId: order._id });
    } catch (error) {
        res.status(500).json({ message: 'Cash payment failed', error: error.message });
    }
};




