const User = require('../models/userModel');
const { authMiddleware } = require('../routes/authRoutes');

// exports.calculatePoints = async (req, res) => {
//     const userId = req.user._id;
//     const { totalAmount } = req.body; 

//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }


//         const pointsToAdd = Math.floor(totalAmount / 40) * 5;
        
//         user.points += pointsToAdd;
//         await user.save();

//         res.status(200).json({ 
//             message: 'Points added successfully',
//             pointsAdded: pointsToAdd,
//             totalPoints: user.points
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };



exports.calculatePoints = async (req, res) => {
    const userId = req.user._id;
    const { totalAmount } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate points - 5 points for every 40 EGP spent
        const pointsToAdd = Math.floor(totalAmount / 40) * 5;
        
        user.points += pointsToAdd;
        await user.save();

        res.status(200).json({ 
            message: 'Points added successfully',
            pointsAdded: pointsToAdd,
            totalPoints: user.points,
            pointsValue: user.points * 0.3 // Each point is worth 0.3 EGP (10 points = 3 EGP)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


exports.calculatePointsValue = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            points: user.points,
            pointsValue: user.points * 0.3, // 10 points = 3 EGP
            currency: "EGP"
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Add a function to redeem points
exports.redeemPoints = async (req, res) => {
    const userId = req.user._id;
    const { usePoints } = req.body; // true/false

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!usePoints || user.points < 10) { // Minimum 10 points to redeem
            return res.status(200).json({
                usePoints: false,
                discount: 0,
                pointsUsed: 0,
                remainingPoints: user.points
            });
        }

        // Calculate maximum possible discount (can't exceed cart total)
        const maxDiscount = user.points * 0.3; // 0.3 EGP per point
        const pointsUsed = user.points;
        
        // Update user points (we'll finalize this in the cart controller)
        user.points = 0;
        await user.save();

        res.status(200).json({
            usePoints: true,
            discount: maxDiscount,
            pointsUsed: pointsUsed,
            remainingPoints: 0
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