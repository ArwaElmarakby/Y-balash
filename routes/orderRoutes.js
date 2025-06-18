const express = require('express');
const router = express.Router();
const { 
    createCashOrder,
    confirmCashPayment
} = require('../controllers/orderController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// إنشاء طلب دفع كاش (للمستخدم العادي)
router.post('/cash', authMiddleware, createCashOrder);

// تأكيد استلام الدفع النقدي (للبائع)
router.post('/confirm-cash', authMiddleware, sellerMiddleware, confirmCashPayment);

module.exports = router;