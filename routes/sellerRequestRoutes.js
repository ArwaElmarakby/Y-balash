const express = require('express');
const router = express.Router();
const { 
  createSellerRequest, 
  getAllSellerRequests, 
  approveSellerRequest 
} = require('../controllers/sellerRequestController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');

// إنشاء طلب بائع جديد
router.post('/request', createSellerRequest);

// عرض طلبات البائعين (للأدمن فقط)
router.get('/requests', authMiddleware, adminMiddleware, getAllSellerRequests);

// الموافقة على طلب بائع (للأدمن فقط)
router.post('/approve', authMiddleware, adminMiddleware, approveSellerRequest);

module.exports = router;