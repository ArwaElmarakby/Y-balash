
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Cart = require('../models/cartModel'); 

exports.createPayment = async (req, res) => {
    const userId = req.user.id; 

    try {
      
        const cart = await Cart.findOne({ userId }).populate('items.itemId');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

       
        let totalAmount = 0;
        cart.items.forEach(item => {
            totalAmount += item.quantity * parseFloat(item.itemId.price);
        });

        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount * 100, 
            currency: 'usd', 
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
