
const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/paymentController');
const { authMiddleware } = require('./authRoutes'); 


router.post('/payment', authMiddleware, createPayment); 

module.exports = router;