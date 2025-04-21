// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { adminMiddleware } = require('../middleware/adminMiddleware');
const User = require('../models/userModel');

// Example admin route to get all users
router.get('/users', adminMiddleware, async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Add more admin routes as needed

module.exports = router;