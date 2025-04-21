
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
const Points = require('../models/pointsModel'); 

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
    
         // Calculate points (5 points for every 40 EGP)
         const pointsToAdd = Math.floor(totalPrice / 40) * 5;

         // Create or update user's points
         let userPoints = await Points.findOne({ userId });
         if (!userPoints) {
             userPoints = new Points({ userId, points: pointsToAdd, totalSpent: totalPrice });
         } else {
             userPoints.points += pointsToAdd;
             userPoints.totalSpent += totalPrice;
         }
         await userPoints.save();

        // Create payment intent with the total price
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalPrice * 100),  // Convert to cents
            currency: 'usd', 
            payment_method_types: ['card'], 
            metadata: {
                userId: userId, 
                pointsEarned: pointsToAdd.toString()
            },
        });

        res.status(200).json({ 
            clientSecret: paymentIntent.client_secret,
            pointsEarned: pointsToAdd,
            totalPoints: userPoints.points
        });
    } catch (error) {
        res.status(500).json({ message: 'Payment failed', error: error.message });
    }
};