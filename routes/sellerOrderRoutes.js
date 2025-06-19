const express = require('express');
const router = express.Router();
const { getOrderDetails } = require('../controllers/sellerOrderController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// مسار جديد محسّن
router.get('/v2/orders', 
    authMiddleware, 
    sellerMiddleware, 
    getOrderDetails
);

module.exports = router;