const express = require('express');
const router = express.Router();
const { 
    createCashOrder,
    confirmCashPayment
} = require('../controllers/orderController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// إنشاء طلب دفع نقدي
router.post('/cash', authMiddleware, createCashOrder);

// تأكيد استلام الدفع النقدي (للبائع)
router.put('/:orderId/confirm-cash', authMiddleware, sellerMiddleware, confirmCashPayment);

module.exports = router;