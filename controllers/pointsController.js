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
        if (usePoints && user.points >= 10) {
            // 10 points = 3 EGP
            discount = Math.floor(user.points / 10) * 3;
            
            // Deduct points (optional: you may want to deduct only after order confirmation)
            // user.points -= Math.floor(discount / 3) * 10;
            // await user.save();
        }

        res.status(200).json({ 
            success: true,
            pointsDiscount: discount,
            pointsUsed: usePoints ? Math.floor(discount / 3) * 10 : 0,
            remainingPoints: user.points
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error 
        });
    }
};