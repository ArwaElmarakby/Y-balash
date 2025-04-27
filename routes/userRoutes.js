const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { authMiddleware } = require('./authRoutes');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer + Cloudinary Storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Get User Data
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const username = user.email.split('@')[0]; 
        res.status(200).json({
            username,
            email: user.email,
            firstName: user.firstName || null, 
            lastName: user.lastName || null,
            gender: user.gender,
            birthday: user.birthday || null,
            phone: user.phone,
            profileImage: user.profileImage || null,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// routes/userRoutes.js
router.put('/update-name', authMiddleware, async (req, res) => {
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
        return res.status(400).json({ message: 'First name and last name are required' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { firstName, lastName },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Name updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update User Birthday
router.put('/update-birthday', authMiddleware, async (req, res) => {
    const { birthday } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { birthday },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Birthday updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update User Phone Number
router.put('/update-phone', authMiddleware, async (req, res) => {
    const { phone } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { phone },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Phone number updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update User Profile Image
router.put('/update-profile-image', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const result = await cloudinary.uploader.upload_stream({ resource_type: 'auto' }, async (error, result) => {
            if (error) {
                return res.status(500).json({ message: 'Image upload failed', error });
            }

            const user = await User.findByIdAndUpdate(
                req.user._id,
                { profileImage: result.secure_url },
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({ message: 'Profile image updated successfully', user });
        }).end(req.file.buffer);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.put('/update-gender', authMiddleware, async (req, res) => {
    const { gender } = req.body;

    // التحقق من أن القيمة المدخلة صحيحة
    if (!['male', 'female', 'other'].includes(gender)) {
        return res.status(400).json({ message: 'Invalid gender value' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { gender },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Gender updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.put('/make-seller/:userId', authMiddleware, async (req, res) => {
    try {

        const currentUser = await User.findById(req.user._id);
        if (currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can make sellers' });
        }


        const userToUpdate = await User.findByIdAndUpdate(
            req.params.userId,
            { role: 'seller' },
            { new: true }
        );

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ 
            message: 'User is now a seller', 
            user: userToUpdate 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


module.exports = router;