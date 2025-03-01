// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment } = require('../controllers/paymentController');

// Create a payment intent
router.post('/create-payment-intent', createPaymentIntent);

// Confirm payment
router.post('/confirm-payment', confirmPayment);

module.exports = router;