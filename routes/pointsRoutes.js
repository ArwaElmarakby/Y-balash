const express = require('express');
const router = express.Router();
const { calculatePoints, getUserPoints } = require('../controllers/pointsController');
const { authMiddleware } = require('./authRoutes');

router.post('/calculate', authMiddleware, calculatePoints);
router.get('/', authMiddleware, getUserPoints);

module.exports = router;