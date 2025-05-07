// middleware/adminMiddleware.js
const User = require('../models/userModel');

const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = adminMiddleware;