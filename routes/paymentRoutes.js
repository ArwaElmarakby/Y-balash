
const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/paymentController');
const { 
    confirmCashPayment,
    completeCashPayment
} = require('../controllers/orderController');
const { authMiddleware } = require('./authRoutes'); 
const sellerMiddleware = require('../middleware/sellerMiddleware');


router.post('/payment', authMiddleware, createPayment); 
router.post('/cash/confirm', authMiddleware, confirmCashPayment); 
router.post('/cash/complete', authMiddleware, sellerMiddleware, completeCashPayment);
module.exports = router;