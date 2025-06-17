const express = require('express');
const router = express.Router();
const { calculatePoints, getUserPoints, calculatePoints, calculatePointsValue, redeemPoints } = require('../controllers/pointsController');
const { authMiddleware } = require('./authRoutes');

router.post('/calculate', authMiddleware, calculatePoints);
router.get('/', authMiddleware, getUserPoints);
router.get('/value', authMiddleware, calculatePointsValue);
router.post('/redeem', authMiddleware, redeemPoints);

module.exports = router;