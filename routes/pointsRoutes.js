const express = require('express');
const router = express.Router();
const { calculatePoints, getUserPoints, usePointsForDiscount, getPointsValue  } = require('../controllers/pointsController');
const { authMiddleware } = require('./authRoutes');

router.post('/calculate', authMiddleware, calculatePoints);
router.get('/', authMiddleware, getUserPoints);
router.post('/use-points', authMiddleware, usePointsForDiscount);
router.get('/value', authMiddleware, getPointsValue);

module.exports = router;