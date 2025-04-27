const User = require('../models/userModel');

const sellerMiddleware = async (req, res, next) => {
    try {

        if (!req.user || !req.user._id) {
            return res.status(401).json({ 
                success: false,
                message: 'Unauthorized: No user data found.' 
            });
        }


        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found.' 
            });
        }


        if (user.role !== 'seller' && user.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Forbidden: Seller or Admin access only.' 
            });
        }


        req.seller = {
            id: user._id,
            email: user.email,
            role: user.role
        };

        next(); 
    } catch (error) {
        console.error('Seller Middleware Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error.',
            error: error.message 
        });
    }
};

module.exports = sellerMiddleware;