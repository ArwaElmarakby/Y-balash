const express = require('express');
const router = express.Router();
const { addPoints, getUserPoints } = require('../controllers/pointsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/add', authMiddleware, addPoints);
router.get('/:userId', authMiddleware, getUserPoints);

module.exports = router;