const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { authMiddleware } = require('./authRoutes');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer + Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "profile_images", // Folder name on Cloudinary
        allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
    },
});

const upload = multer({ storage: storage }).single("profileImage");

// Get User Data
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password'); // Exclude password from the response
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract name from email (before @)
        const nameFromEmail = user.email.split('@')[0];

        res.status(200).json({
            nameFromEmail,
            email: user.email,
            name: user.name,
            gender: user.gender,
            birthday: user.birthday,
            phone: user.phone,
            profileImage: user.profileImage,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update User Name
router.put('/update-name', authMiddleware, async (req, res) => {
    const { name } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Name updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update User Gender
router.put('/update-gender', authMiddleware, async (req, res) => {
    const { gender } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { gender },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Gender updated successfully', user });
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
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Birthday updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update User Phone
router.put('/update-phone', authMiddleware, async (req, res) => {
    const { phone } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { phone },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Phone updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update User Profile Image
router.put('/update-profile-image', authMiddleware, upload, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profileImage: req.file.path }, // Save Cloudinary image URL
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile image updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;