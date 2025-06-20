// routes/withdrawalRoutes.js
const express = require('express');
const router = express.Router();
const {
  requestWithdrawal,
  getWithdrawalRequests,
  getAllWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal
} = require('../controllers/withdrawalController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// طرق البائع
router.post('/request', authMiddleware, sellerMiddleware, requestWithdrawal);
router.get('/my-requests', authMiddleware, sellerMiddleware, getWithdrawalRequests);

// طرق الأدمن
router.get('/admin/pending', authMiddleware, adminMiddleware, getAllWithdrawalRequests);
router.put('/admin/approve/:restaurantId/:requestId', authMiddleware, adminMiddleware, approveWithdrawal);
router.put('/admin/reject/:restaurantId/:requestId', authMiddleware, adminMiddleware, rejectWithdrawal);

module.exports = router;