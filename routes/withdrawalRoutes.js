// routes/withdrawalRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createWithdrawalRequest,
  approveWithdrawal,
  rejectWithdrawal,
  getSellerRequests,
  getAllRequests
} = require('../controllers/withdrawalController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');
const sellerMiddleware = require('../middleware/sellerMiddleware');

// طرق البائع
router.post('/request', authMiddleware, sellerMiddleware, createWithdrawalRequest);
router.get('/my-requests', authMiddleware, sellerMiddleware, getSellerRequests);

// طرق الإداري
router.put('/approve', authMiddleware, adminMiddleware, approveWithdrawal);
router.put('/reject', authMiddleware, adminMiddleware, rejectWithdrawal);
router.get('/all', authMiddleware, adminMiddleware, getAllRequests);

module.exports = router;