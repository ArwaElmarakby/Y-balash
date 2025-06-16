const express = require('express');
const router = express.Router();
const { calculatePoints, getUserPoints, usePoints } = require('../controllers/pointsController');
const { authMiddleware } = require('./authRoutes');

router.post('/calculate', authMiddleware, calculatePoints);
router.get('/', authMiddleware, getUserPoints);
router.post('/use-points', authMiddleware, usePoints);
module.exports = router;