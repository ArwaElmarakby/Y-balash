const User = require('../models/userModel');

const adminMiddleware = async (req, res, next) => {
    const userId = req.user._id; 

    try {
        const user = await User.findById(userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        next(); 
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = adminMiddleware;