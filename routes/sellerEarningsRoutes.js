// routes/sellerEarningsRoutes.js
const express = require('express');
const router = express.Router();
const { deductFromEarnings } = require('../controllers/sellerEarningsController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');

router.post('/deduct-earnings', 
    authMiddleware, 
    sellerMiddleware, 
    deductFromEarnings
);

module.exports = router;