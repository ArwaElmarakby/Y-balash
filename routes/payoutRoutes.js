// routes/payoutRoutes.js
const express = require('express');
const router = express.Router();
const { requestCardPayout } = require('../controllers/payoutController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');

router.post('/card-payout', 
  authMiddleware, 
  sellerMiddleware, 
  requestCardPayout
);

module.exports = router;