// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { authMiddleware } = require('./authRoutes'); // Use your existing auth middleware

router.post('/promote', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id; // Get the user ID from the token
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }

        // Promote user to admin
        user.isAdmin = true;
        await user.save();

        res.status(200).json({ message: 'User  promoted to admin successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});




router.put('/make-seller/:userId', authMiddleware, async (req, res) => {
    try {

        const adminUser = await User.findById(req.user._id);
        if (adminUser.role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Only admins can perform this action.' 
            });
        }


        const userToUpdate = await User.findById(req.params.userId);
        if (!userToUpdate) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found.' 
            });
        }


        userToUpdate.role = 'seller';
        await userToUpdate.save();


        res.status(200).json({ 
            success: true,
            message: 'User role updated to seller successfully.',
            user: {
                _id: userToUpdate._id,
                email: userToUpdate.email,
                role: userToUpdate.role
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Failed to update user role.',
            error: error.message 
        });
    }
});



module.exports = router;