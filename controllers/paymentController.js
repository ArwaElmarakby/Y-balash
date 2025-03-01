// controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a payment intent
exports.createPaymentIntent = async (req, res) => {
    const { amount, currency, paymentMethodType } = req.body;

    try {
        // Create a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: currency || 'usd',
            payment_method_types: [paymentMethodType || 'card'],
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ message: 'Payment failed', error: error.message });
    }
};

// Confirm payment
exports.confirmPayment = async (req, res) => {
    const { paymentIntentId } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
        res.status(200).json({ message: 'Payment confirmed', paymentIntent });
    } catch (error) {
        res.status(500).json({ message: 'Payment confirmation failed', error: error.message });
    }
};