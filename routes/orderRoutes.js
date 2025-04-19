const express = require('express');
const router = express.Router();
const { getOrderStatistics } = require('../controllers/orderController');

router.get('/statistics', getOrderStatistics);

module.exports = router;