const User = require('../models/userModel');

const adminMiddleware = async (req, res, next) => {
    const userId = req.user._id; // Assuming you have user info in req.user
    const user = await User.findById(userId);

    if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Access denied, admin only' });
    }
    next();
};

module.exports = adminMiddleware;