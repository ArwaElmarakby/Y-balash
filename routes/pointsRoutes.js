// routes/pointsRoutes.js
const express = require('express');
const router = express.Router();
const Points = require('../models/pointsModel');
const { authMiddleware } = require('./authRoutes');

// Get user's points
router.get('/', authMiddleware, async (req, res) => {
    try {
        const points = await Points.findOne({ userId: req.user._id });
        if (!points) {
            return res.status(200).json({ points: 0, totalSpent: 0 });
        }
        res.status(200).json(points);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;