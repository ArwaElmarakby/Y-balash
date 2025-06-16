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



exports.usePoints = async (req, res) => {
    const userId = req.user._id;
    const { pointsToUse } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (pointsToUse > user.points) {
            return res.status(400).json({ message: 'Not enough points' });
        }

        // سيتم تأكيد استخدام النقاط عند نجاح الدفع
        res.status(200).json({ 
            message: 'Points will be applied to payment',
            pointsToUse,
            discountAmount: Math.floor(pointsToUse / 5)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};