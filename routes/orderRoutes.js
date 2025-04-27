// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { getRecentOrders } = require('../controllers/orderController');


router.get('/recent', getRecentOrders);

module.exports = router;