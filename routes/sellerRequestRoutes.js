// routes/sellerRequestRoutes.js
const express = require('express');
const router = express.Router();
const {
  requestSellerAccount,
  approveSellerRequest,
  rejectSellerRequest,
  getAllSellerRequests
} = require('../controllers/sellerRequestController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');


router.post('/request', requestSellerAccount);


router.get('/requests', authMiddleware, adminMiddleware, getAllSellerRequests);
router.put('/approve/:requestId', authMiddleware, adminMiddleware, approveSellerRequest);
router.put('/reject/:requestId', authMiddleware, adminMiddleware, rejectSellerRequest);

module.exports = router;