const express = require('express');
const router = express.Router();
const { calculatePoints, getUserPoints, applyPointsDiscount  } = require('../controllers/pointsController');
const { authMiddleware } = require('./authRoutes');

router.post('/calculate', authMiddleware, calculatePoints);
router.get('/', authMiddleware, getUserPoints);
router.post('/apply-discount', authMiddleware, applyPointsDiscount);

module.exports = router;