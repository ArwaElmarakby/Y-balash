const express = require('express');
const router = express.Router();
const { 
    createCashOrder,
    confirmCashPayment
} = require('../controllers/orderController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// مسار لإنشاء طلب دفع كاش (للمستخدم)
router.post('/cash', authMiddleware, createCashOrder);

// مسار لتأكيد الدفع النقدي (للبائع)
router.post('/cash/confirm', authMiddleware, sellerMiddleware, confirmCashPayment);

module.exports = router;