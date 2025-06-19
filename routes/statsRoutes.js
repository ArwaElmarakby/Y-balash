// routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');

router.get('/users/stats', async (req, res) => {
    try {
        const currentDate = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const totalUsers = await User.countDocuments();
        
        const lastMonthCount = await User.countDocuments({
            createdAt: { $gte: lastMonth, $lte: currentDate }
        });

        let percentageIncrease = 0;
        if (lastMonthCount > 0) {
            percentageIncrease = ((totalUsers - lastMonthCount) / lastMonthCount) * 100;
        }

        res.status(200).json({
            success: true,
            totalUsers,
            percentageIncrease: percentageIncrease.toFixed(2)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
});

module.exports = router;