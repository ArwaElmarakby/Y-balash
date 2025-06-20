// routes/withdrawalRoutes.js
const express = require('express');
const router = express.Router();
const { 
  requestWithdrawal, 
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} = require('../controllers/withdrawalController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// طرق البائع
router.post('/request', authMiddleware, sellerMiddleware, requestWithdrawal);
router.get('/', authMiddleware, sellerMiddleware, getWithdrawals);

// طرق المسؤول
router.put('/:withdrawalId/approve', authMiddleware, adminMiddleware, approveWithdrawal);
router.put('/:withdrawalId/reject', authMiddleware, adminMiddleware, rejectWithdrawal);

module.exports = router;