const User = require('../models/userModel');
const sellerMiddleware = require('../middleware/sellerMiddleware');

const sellerMiddleware = async (req, res, next) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user || !user.isSeller) {
            return res.status(403).json({ message: 'Access denied. Sellers only.' });
        }
        req.seller = user;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = sellerMiddleware;