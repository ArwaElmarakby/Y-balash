
const express = require('express');
const router = express.Router();
const { createPayment, createCashPayment, confirmCashPayment } = require('../controllers/paymentController');
const { authMiddleware } = require('./authRoutes'); 
const { sellerMiddleware } = require('../middleware/sellerMiddleware');

router.post('/payment', authMiddleware, createPayment); 
router.post('/cash-payment', authMiddleware, createCashPayment);
router.put('/cash-payment/:orderId/confirm', authMiddleware, sellerMiddleware, confirmCashPayment);

module.exports = router;