const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { authMiddleware } = require('./authRoutes');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { getOrderPoints } = require('../controllers/authController');

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
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        if (!req.file) {
            if (user.profileImage) {

                const publicId = user.profileImage.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }

            user.profileImage = null;
            await user.save();

            return res.status(200).json({ 
                message: 'Profile image removed successfully',
                user: {
                    _id: user._id,
                    email: user.email,
                    profileImage: null
                }
            });
        }


        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'user-profiles' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer);
        });


        if (user.profileImage) {
            const oldPublicId = user.profileImage.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(oldPublicId);
        }

        user.profileImage = result.secure_url;
        await user.save();

        res.status(200).json({
            message: 'Profile image updated successfully',
            user: {
                _id: user._id,
                email: user.email,
                profileImage: result.secure_url
            }
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
});


router.put('/update-gender', authMiddleware, async (req, res) => {
    const { gender } = req.body;

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



router.get('/my-id', authMiddleware, async (req, res) => {
    try {

        const userId = req.user._id;

        res.status(200).json({ 
            userId,
            email: req.user.email 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.get('/my-profile', authMiddleware, async (req, res) => {
    try {

        const user = req.user;

        res.status(200).json({
            _id: user._id,
            email: user.email,
            phone: user.phone,
            isAdmin: user.isAdmin,
            isSeller: user.isSeller,

        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/welcome', authMiddleware, (req, res) => {
    try {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        const formattedDate = today.toLocaleDateString('en-US', options); // English formatting

        const welcomeMessage = `Welcome back, ${req.user.firstName || 'Seller'}!`;
        const response = {
            message: welcomeMessage,
            date: formattedDate
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.post('/order-points', authMiddleware, getOrderPoints);

module.exports = router;