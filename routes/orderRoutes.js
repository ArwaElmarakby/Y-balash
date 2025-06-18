const express = require('express');
const router = express.Router();
const { createOrder, confirmCashPayment } = require('../controllers/orderController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// Create new order (for users)
router.post('/', authMiddleware, createOrder);

// Confirm cash payment (for sellers)
router.put('/:orderId/confirm-payment', authMiddleware, sellerMiddleware, confirmCashPayment);

module.exports = router;