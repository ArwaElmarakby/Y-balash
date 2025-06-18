const express = require('express');
const router = express.Router();
const { createCashOrder, confirmCashPayment } = require('../controllers/cashPaymentController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// العميل ينشئ طلب دفع كاش
router.post('/create', authMiddleware, createCashOrder);

// البائع يؤكد استلام الدفع
router.post('/confirm', authMiddleware, sellerMiddleware, confirmCashPayment);

module.exports = router;