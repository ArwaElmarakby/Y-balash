const express = require('express');
const router = express.Router();
const { 
    createCashOrder,
    confirmCashPayment,
    getCashOrders
} = require('../controllers/cashPaymentController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// إنشاء طلب دفع نقدي (للمستخدم)
router.post('/create', authMiddleware, createCashOrder);

// تأكيد استلام الدفع النقدي (للبائع)
router.put('/confirm/:orderId', authMiddleware, sellerMiddleware, confirmCashPayment);

// الحصول على الطلبات النقدية (للبائع)
router.get('/seller', authMiddleware, sellerMiddleware, getCashOrders);

module.exports = router;