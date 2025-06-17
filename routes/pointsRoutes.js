const express = require('express');
const router = express.Router();
const { calculatePoints, getUserPoints, usePointsForDiscount  } = require('../controllers/pointsController');
const { authMiddleware } = require('./authRoutes');

router.post('/calculate', authMiddleware, calculatePoints);
router.get('/', authMiddleware, getUserPoints);
router.post('/use-for-discount', authMiddleware, usePointsForDiscount);

module.exports = router;