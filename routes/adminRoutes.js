// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Order = require('../models/orderModel');
const { authMiddleware } = require('./authRoutes'); // Use your existing auth middleware
const adminMiddleware = require('../middleware/adminMiddleware');

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



router.post('/approve-seller', adminMiddleware, async (req, res) => {
    const { email, restaurantName } = req.query;
    const { tempPassword } = req.body; // Admin provides temp password
    
    if (!email || !restaurantName || !tempPassword) {
        return res.status(400).json({ message: 'Email, restaurant name and temporary password are required' });
    }

    try {
        // Create or update user as seller
        let user = await User.findOne({ email });
        
        if (!user) {
            // Create new user if doesn't exist
            user = new User({ 
                email,
                password: tempPassword, // Will be hashed by pre-save hook
                isSeller: true
            });
        } else {
            // Update existing user
            user.isSeller = true;
            user.password = tempPassword;
        }

        // Create new restaurant or find existing
        let restaurant = await Restaurant.findOne({ name: restaurantName });
        
        if (!restaurant) {
            restaurant = new Restaurant({
                name: restaurantName,
                imageUrl: 'default-restaurant-image.jpg' // Set a default
            });
            await restaurant.save();
        }

        // Assign restaurant to seller
        user.managedRestaurant = restaurant._id;
        await user.save();

        // Email credentials to seller
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: "Your Seller Account Has Been Approved",
            text: `Your seller account for ${restaurantName} has been approved.
                   Login with:
                   Email: ${email}
                   Password: ${tempPassword}
                   
                   Please change your password after first login.`,
            html: `<h3>Your seller account for ${restaurantName} has been approved</h3>
                   <p>Login with:</p>
                   <p>Email: ${email}</p>
                   <p>Password: ${tempPassword}</p>
                   <p><strong>Please change your password after first login.</strong></p>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            message: 'Seller account created successfully',
            seller: {
                email: user.email,
                restaurant: restaurant.name
            }
        });
    } catch (error) {
        console.error("Error approving seller:", error);
        res.status(500).json({ message: 'Error approving seller', error });
    }
});


module.exports = router;