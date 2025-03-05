// controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createPayment = async (req, res) => {
    const { amount } = req.body; // نجيب المبلغ من الـ Body
    const userId = req.user.id; // نجيب الـ User ID من الـ Token

    try {
        // ننشئ Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // نحول المبلغ إلى سنتات
            currency: 'usd', // العملة
            payment_method_types: ['card'], // طريقة الدفع
            metadata: {
                userId: userId, // نحفظ الـ User ID في metadata
            },
        });

        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ message: 'Payment failed', error: error.message });
    }
};