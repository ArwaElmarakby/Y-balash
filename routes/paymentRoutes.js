// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/paymentController');
const { authMiddleware } = require('./authRoutes'); // استيراد الـ Middleware للتأكد من الـ Token

// Create a payment
router.post('/payment', authMiddleware, createPayment); // Endpoint جديد

module.exports = router;