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

// exports.getUserPoints = async (req, res) => {
//     const userId = req.user._id;

//     try {
//         const user = await User.findById(userId).select('points');
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         res.status(200).json({ points: user.points });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };







const POINTS_CONVERSION_RATE = 10 / 3; // 10 points per 3 EGP

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

        res.status(200).json({ 
            points: user.points,
            // Add conversion information
            conversionRate: "10 points = 3 EGP",
            maxDiscount: calculateDiscountFromPoints(user.points)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// New function to apply points discount
exports.applyPointsDiscount = async (req, res) => {
    const userId = req.user._id;
    const { usePoints } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!usePoints || user.points < 10) {
            return res.status(200).json({
                discountAmount: 0,
                pointsUsed: 0,
                remainingPoints: user.points
            });
        }

        // Calculate maximum discount based on points
        const maxDiscount = calculateDiscountFromPoints(user.points);
        const pointsToUse = Math.floor(maxDiscount * POINTS_CONVERSION_RATE);

        user.points -= pointsToUse;
        await user.save();

        res.status(200).json({
            discountAmount: maxDiscount,
            pointsUsed: pointsToUse,
            remainingPoints: user.points
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Helper function to calculate discount from points
function calculateDiscountFromPoints(points) {
    // 10 points = 3 EGP
    return Math.floor(points / 10) * 3;
}