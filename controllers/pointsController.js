const User = require('../models/userModel');

exports.addPoints = async (req, res) => {
    const { userId, amount } = req.body;

    try {
       
        const pointsToAdd = Math.floor(amount / 40) * 5;

        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { points: pointsToAdd } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Points added successfully',
            points: user.points,
            pointsAdded: pointsToAdd
        });
    } catch (error) {
        console.error("Error adding points:", error);
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getUserPoints = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            points: user.points
        });
    } catch (error) {
        console.error("Error getting user points:", error);
        res.status(500).json({ message: 'Server error', error });
    }
};