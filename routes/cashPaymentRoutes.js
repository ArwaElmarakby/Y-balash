// routes/cashPaymentRoutes.js
const express = require('express');
const router = express.Router();
const { createCashOrder, confirmCashPayment } = require('../controllers/cashPaymentController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// للمستخدم العادي
router.post('/create', authMiddleware, createCashOrder);

// للبائع
router.put('/confirm/:orderId', authMiddleware, sellerMiddleware, confirmCashPayment);

module.exports = router;