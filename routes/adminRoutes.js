// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Order = require('../models/orderModel');
const { authMiddleware } = require('./authRoutes'); // Use your existing auth middleware
const adminMiddleware = require('../middleware/adminMiddleware');
const nodemailer = require('nodemailer');

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


router.post('/assign-seller', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId, restaurantId } = req.body;

    try {
        const [user, restaurant] = await Promise.all([
            User.findById(userId),
            Restaurant.findById(restaurantId)
        ]);

        if (!user || !restaurant) {
            return res.status(404).json({ message: 'User or restaurant not found' });
        }

        user.isSeller = true;
        user.managedRestaurant = restaurantId;
        await user.save();

        res.status(200).json({ 
            message: 'Seller assigned to restaurant successfully',
            user: {
                _id: user._id,
                email: user.email,
                isSeller: true,
                managedRestaurant: restaurant.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.post('/remove-seller', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isSeller) {
            return res.status(400).json({ message: 'User is not a seller' });
        }

        user.isSeller = false;
        user.managedRestaurant = undefined;
        await user.save();

        res.status(200).json({ 
            message: 'Seller removed successfully',
            user: {
                _id: user._id,
                email: user.email,
                isSeller: false
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/sellers', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const sellers = await User.find({ isSeller: true })
            .populate('managedRestaurant', 'name imageUrl')
            .select('-password');

        res.status(200).json({
            count: sellers.length,
            sellers
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [usersCount, sellersCount, adminsCount, restaurantsCount, ordersCount] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isSeller: true }),
            User.countDocuments({ isAdmin: true }),
            Restaurant.countDocuments(),
            Order.countDocuments()
        ]);

        res.status(200).json({
            stats: {
                totalUsers: usersCount,
                totalSellers: sellersCount,
                totalAdmins: adminsCount,
                totalRestaurants: restaurantsCount,
                totalOrders: ordersCount
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.put('/toggle-user/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({ 
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user: {
                _id: user._id,
                email: user.email,
                isActive: user.isActive
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/orders', authMiddleware, adminMiddleware, async (req, res) => {
    const { status, restaurantId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (restaurantId) filter.restaurantId = restaurantId;

    try {
        const orders = await Order.find(filter)
            .populate('userId', 'email phone')
            .populate('restaurantId', 'name')
            .populate('items.itemId', 'name price')
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.post('/handle-seller-request', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId, action } = req.body; // action: 'approve' or 'reject'

    try {
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.pendingSeller) {
            return res.status(400).json({ message: 'No pending seller request for this user' });
        }

        if (action === 'approve') {
            // Generate random password
            const randomPassword = Math.random().toString(36).slice(-8);
            
            user.isSeller = true;
            user.pendingSeller = false;
            user.password = randomPassword; // This will be hashed by the pre-save hook
            await user.save();

            // Send email to seller with credentials
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL,
                to: user.email,
                subject: 'Seller Account Approved',
                html: `
                    <h2>Your Seller Account Has Been Approved</h2>
                    <p>You can now login to your seller account using the following credentials:</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Password:</strong> ${randomPassword}</p>
                    <p>Please change your password after logging in.</p>
                `,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ 
                message: 'Seller request approved and credentials sent',
                user: {
                    _id: user._id,
                    email: user.email,
                    isSeller: true
                }
            });
        } else if (action === 'reject') {
            user.pendingSeller = false;
            await user.save();

            // Send rejection email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL,
                to: user.email,
                subject: 'Seller Request Rejected',
                html: `
                    <h2>Your Seller Request Has Been Rejected</h2>
                    <p>We regret to inform you that your request to become a seller has been rejected.</p>
                    <p>Contact support for more information.</p>
                `,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ 
                message: 'Seller request rejected',
                user: {
                    _id: user._id,
                    email: user.email,
                    isSeller: false
                }
            });
        } else {
            res.status(400).json({ message: 'Invalid action' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Get pending seller requests
router.get('/pending-sellers', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const pendingSellers = await User.find({ pendingSeller: true })
            .select('_id email firstName lastName createdAt');

        res.status(200).json({
            count: pendingSellers.length,
            pendingSellers
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



module.exports = router;