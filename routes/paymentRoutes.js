
const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/paymentController');
const { cashPayment } = require('../controllers/paymentController');
const { authMiddleware } = require('./authRoutes'); 


router.post('/payment', authMiddleware, createPayment); 
router.post('/cash-payment', authMiddleware, cashPayment);

module.exports = router;