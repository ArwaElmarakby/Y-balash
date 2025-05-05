const express = require('express');
const router = express.Router();
const { 
  requestToBecomeSeller,
  getAllSellerRequests,
  approveSellerRequest
} = require('../controllers/sellerRequestController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');

// أي مستخدم مسجل يمكنه طلب أن يصبح بائعاً
router.post('/request', authMiddleware, requestToBecomeSeller);

// فقط المسؤول يمكنه رؤية الطلبات والموافقة عليها
router.get('/all', authMiddleware, adminMiddleware, getAllSellerRequests);
router.post('/approve', authMiddleware, adminMiddleware, approveSellerRequest);

module.exports = router;