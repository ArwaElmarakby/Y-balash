// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const { getTotalSellers } = require('../controllers/sellerController');

router.get('/total', getTotalSellers);

module.exports = router;