const User = require('../models/userModel');

const adminMiddleware = async (req, res, next) => {
    try {
        // إذا كان المسؤول يسجل دخولاً لأول مرة بدون حساب
        if (req.user.email === 'yabalash001@gmail.com') {
            req.user.isAdmin = true;
            return next();
        }

        // التحقق التقليدي من المسؤولين
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (user.isAdmin) {
            return next();
        }
        
        res.status(403).json({ message: 'Admin access required' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = adminMiddleware;