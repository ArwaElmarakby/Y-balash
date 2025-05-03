const express = require('express');
const router = express.Router();
const { 
  getSellerNotifications,
  markAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');

router.get('/', authMiddleware, sellerMiddleware, getSellerNotifications);
router.put('/:notificationId/read', authMiddleware, sellerMiddleware, markAsRead);
router.delete('/:notificationId', authMiddleware, sellerMiddleware, deleteNotification);

module.exports = router;