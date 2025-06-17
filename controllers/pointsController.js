const User = require('../models/userModel');
const { authMiddleware } = require('../routes/authRoutes');

exports.calculatePoints = async (req, res) => {
    const userId = req.user._id;
    const { totalAmount } = req.body; 

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        const pointsToAdd = Math.floor(totalAmount / 40) * 5;
        
        user.points += pointsToAdd;
        await user.save();

        res.status(200).json({ 
            message: 'Points added successfully',
            pointsAdded: pointsToAdd,
            totalPoints: user.points
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getUserPoints = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId).select('points');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ points: user.points });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};





exports.usePointsForDiscount = async (req, res) => {
    const userId = req.user._id;
    const { usePoints } = req.body; // true/false

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let discount = 0;
        let pointsUsed = 0;

        if (usePoints && user.points >= 10) {
            // 10 points = 2 EGP discount
            pointsUsed = Math.floor(user.points / 10) * 10;
            discount = (pointsUsed / 10) * 2;
            
            // Subtract used points (we'll confirm after cart calculation)
            // user.points -= pointsUsed;
            // await user.save();
        }

        res.status(200).json({
            success: true,
            usePoints,
            pointsUsed,
            discountAmount: discount,
            remainingPoints: user.points - pointsUsed
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

exports.confirmPointsUsage = async (req, res) => {
    const userId = req.user._id;
    const { pointsUsed } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (pointsUsed > user.points) {
            return res.status(400).json({ message: 'Not enough points' });
        }

        user.points -= pointsUsed;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Points used successfully',
            remainingPoints: user.points
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};