const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./authRoutes');
const UserProfile = require('../models/userProfileModel');
const User = require('../models/userModel');
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
        folder: "user-profiles", // Folder name on Cloudinary
        allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
    },
});

const upload = multer({ storage: storage }).single("profileImage");

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userProfile = await UserProfile.findOne({ userId: req.user._id });
        if (!userProfile) {
            return res.status(404).json({ message: 'User profile not found' });
        }
        res.status(200).json(userProfile);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update user profile image
router.put('/profile/image', authMiddleware, upload, async (req, res) => {
    try {
        const userProfile = await UserProfile.findOne({ userId: req.user._id });
        if (!userProfile) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        if (req.file) {
            userProfile.profileImage = req.file.path;
            await userProfile.save();
            res.status(200).json({ message: 'Profile image updated successfully', userProfile });
        } else {
            res.status(400).json({ message: 'No image uploaded' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update user name
router.put('/profile/name', authMiddleware, async (req, res) => {
    const { name } = req.body;

    try {
        const userProfile = await UserProfile.findOne({ userId: req.user._id });
        if (!userProfile) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        userProfile.name = name;
        await userProfile.save();
        res.status(200).json({ message: 'Name updated successfully', userProfile });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update user gender
router.put('/profile/gender', authMiddleware, async (req, res) => {
    const { gender } = req.body;

    try {
        const userProfile = await UserProfile.findOne({ userId: req.user._id });
        if (!userProfile) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        userProfile.gender = gender;
        await userProfile.save();
        res.status(200).json({ message: 'Gender updated successfully', userProfile });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update user birthday
router.put('/profile/birthday', authMiddleware, async (req, res) => {
    const { birthday } = req.body;

    try {
        const userProfile = await UserProfile.findOne({ userId: req.user._id });
        if (!userProfile) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        userProfile.birthday = birthday;
        await userProfile.save();
        res.status(200).json({ message: 'Birthday updated successfully', userProfile });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update user phone number
router.put('/profile/phone', authMiddleware, async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        const userProfile = await UserProfile.findOne({ userId: req.user._id });
        if (!userProfile) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        userProfile.phoneNumber = phoneNumber;
        await userProfile.save();
        res.status(200).json({ message: 'Phone number updated successfully', userProfile });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;