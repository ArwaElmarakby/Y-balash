const express = require('express');
const router = express.Router();
const {
  requestSellerAccount,
  getAllRequests,
  approveRequest,
  rejectRequest
} = require('../controllers/sellerRequestController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');

// أي مستخدم يمكنه إرسال طلب انضمام كبائع
router.post('/request', authMiddleware, requestSellerAccount);

// المسؤول فقط يمكنه رؤية الطلبات والموافقة عليها أو رفضها
router.get('/requests', authMiddleware, adminMiddleware, getAllRequests);
router.put('/approve/:requestId', authMiddleware, adminMiddleware, approveRequest);
router.put('/reject/:requestId', authMiddleware, adminMiddleware, rejectRequest);

module.exports = router;