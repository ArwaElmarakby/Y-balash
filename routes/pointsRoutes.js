const express = require('express');
const router = express.Router();
const { calculatePoints, getUserPoints, confirmPointsUsage, applyPointsDiscount } = require('../controllers/pointsController');
// const { applyPointsDiscount  } = require('../controllers/cartController');
const { authMiddleware } = require('./authRoutes');

router.post('/calculate', authMiddleware, calculatePoints);
router.get('/', authMiddleware, getUserPoints);
router.post('/apply-discount', authMiddleware, applyPointsDiscount);
router.post('/confirm-usage', authMiddleware, confirmPointsUsage);

module.exports = router;