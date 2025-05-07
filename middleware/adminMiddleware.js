// // middleware/adminMiddleware.js
// const User = require('../models/userModel');

// const adminMiddleware = async (req, res, next) => {
//     try {
//         const user = await User.findById(req.user._id);
//         if (!user || !user.isAdmin) {
//             return res.status(403).json({ success: false, message: 'Admin access required' });
//         }
//         next();
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Server error', error: error.message });
//     }
// };

// module.exports = adminMiddleware;









const User = require('../models/userModel');

const adminMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Admin access denied' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Admin Middleware Error:', error);
        res.status(401).json({ 
            message: 'Invalid token',
            error: error.message 
        });
    }
};

module.exports = adminMiddleware;