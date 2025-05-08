// middleware/activityMiddleware.js
const User = require('../models/userModel');

const updateLastActive = async (req, res, next) => {
    if (req.user) {
        try {
            await User.findByIdAndUpdate(req.user._id, { 
                lastActive: new Date() 
            });
        } catch (error) {
            console.error("Error updating last active:", error);
        }
    }
    next();
};

module.exports = updateLastActive;