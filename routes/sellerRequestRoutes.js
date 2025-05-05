const express = require('express');
const router = express.Router();
const { 
  createSellerRequest, 
  getAllSellerRequests, 
  approveSellerRequest 
} = require('../controllers/sellerRequestController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');

// أي مستخدم يمكنه إنشاء طلب بائع
router.post('/request', createSellerRequest);

// الأدمن فقط يمكنه رؤية الطلبات والموافقة عليها
router.get('/requests', authMiddleware, adminMiddleware, getAllSellerRequests);
router.post('/approve', authMiddleware, adminMiddleware, approveSellerRequest);

module.exports = router;