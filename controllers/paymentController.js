
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





const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Cart = require('../models/cartModel'); 

exports.createPayment = async (req, res) => {
    const userId = req.user.id; 

    try {
        // Get cart with populated items and offers
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

        // Calculate additional charges
        const shippingCost = 50; 
        const importCharges = (totalItemsPrice + totalOffersPrice) * 0.1;

        // Calculate total amount including all charges
        const totalAmount = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

        // Create payment intent with the full total amount
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Convert to cents and round
            currency: 'usd', 
            payment_method_types: ['card'], 
            metadata: {
                userId: userId, 
            },
        });

        res.status(200).json({ 
            clientSecret: paymentIntent.client_secret,
            totalAmount: totalAmount.toFixed(2) // Optional: send back the total amount for display
        });
    } catch (error) {
        res.status(500).json({ message: 'Payment failed', error: error.message });
    }
};