// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { getRecentOrders } = require('../controllers/orderController');
const { updateOrderStatus } = require('../controllers/orderController');

router.get('/recent', getRecentOrders);
router.put('/:id/status', updateOrderStatus); 

module.exports = router;