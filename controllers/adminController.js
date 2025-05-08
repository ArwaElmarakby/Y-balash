const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Image = require('../models/imageModel');
const Category = require('../models/categoryModel');
const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Rating = require('../models/ratingModel');


exports.assignSellerToRestaurant = async (req, res) => {
    const { userId, restaurantId } = req.body;

    try {

        const user = await User.findById(userId);
        const restaurant = await Restaurant.findById(restaurantId);

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
                managedRestaurant: restaurant.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


exports.getAllSellers = async (req, res) => {
    try {
        const sellers = await User.find({ isSeller: true })
            .populate('managedRestaurant', 'name');

        res.status(200).json(sellers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


exports.getAdminAlerts = async (req, res) => {
    try {

        const [flaggedProductsCount, pendingSellerApprovals, lowStockItemsCount] = await Promise.all([
            Image.countDocuments({ flagged: true }),
            User.countDocuments({ isSellerRequested: true, isSeller: false }),
            Image.countDocuments({ quantity: { $lte: 10 } })
        ]);

        res.status(200).json({
            success: true,
            alerts: {
                flaggedProducts: flaggedProductsCount,
                pendingSellerApprovals: pendingSellerApprovals,
                lowStockItems: lowStockItemsCount,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        console.error("Error in getAdminAlerts:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin alerts',
            error: error.message
        });
    }
};



exports.getTopCategories = async (req, res) => {
    try {
        const topCategories = await Category.aggregate([
            {
                $lookup: {
                    from: "images",
                    localField: "items",
                    foreignField: "_id",
                    as: "products"
                }
            },
            {
                $project: {
                    name: 1,
                    productCount: { $size: "$products" }
                }
            },
            { $sort: { productCount: -1 } },
            { $limit: 3 }
        ]);

        res.status(200).json({
            success: true,
            topCategories
        });
    } catch (error) {
        console.error("Error fetching top categories:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch top categories",
            error: error.message
        });
    }
};


exports.getSellerPerformance = async (req, res) => {
    const { sellerId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({ message: 'Invalid seller ID format' });
        }

        const seller = await User.findById(sellerId)
            .select('email managedRestaurant createdAt lastActive')
            .populate('managedRestaurant', 'name imageUrl');
        
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'Seller is not managing any restaurant' });
        }

        const [totalProducts, totalOrders, totalEarnings, ratingStats] = await Promise.all([
            Image.countDocuments({ restaurant: seller.managedRestaurant._id }),
            Order.countDocuments({ restaurantId: seller.managedRestaurant._id }),
            Order.aggregate([
                {
                    $match: {
                        restaurantId: seller.managedRestaurant._id,
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$totalAmount" }
                    }
                }
            ]),
            Rating.aggregate([
                {
                    $match: {
                        sellerId: seller._id
                    }
                },
                {
                    $group: {
                        _id: null,
                        average: { $avg: "$rating" },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const sellerRating = ratingStats[0]?.average || 0;
        const ratingCount = ratingStats[0]?.count || 0;

        res.status(200).json({
            seller: {
                _id: seller._id,
                email: seller.email,
                lastActive: seller.lastActive || seller.createdAt,
                restaurant: {
                    _id: seller.managedRestaurant._id,
                    name: seller.managedRestaurant.name,
                    imageUrl: seller.managedRestaurant.imageUrl
                }
            },
            performance: {
                totalProducts,
                totalOrders,
                totalEarnings: totalEarnings[0]?.total || 0,
                currency: 'EGP',
                rating: sellerRating,
                ratingCount,
                lastUpdated: new Date()
            }
        });

    } catch (error) {
        console.error('Error in getSellerPerformance:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: {
                name: error.name,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
};