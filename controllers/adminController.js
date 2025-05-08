const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Image = require('../models/imageModel');
const Category = require('../models/categoryModel');


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
        // Get seller details
        const seller = await User.findById(sellerId)
            .select('isSeller managedRestaurant lastActive')
            .populate('managedRestaurant', 'name');
        
        if (!seller || !seller.isSeller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'Seller has no assigned restaurant' });
        }

        // Get performance stats
        const [productsCount, ordersCount, earnings] = await Promise.all([
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
            ])
        ]);

        // Calculate rating (simple average for demo)
        const ratingAggregation = await Order.aggregate([
            {
                $match: {
                    restaurantId: seller.managedRestaurant._id,
                    'rating': { $exists: true }
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" }
                }
            }
        ]);

        const rating = ratingAggregation[0]?.averageRating || 0;

        res.status(200).json({
            seller: {
                id: seller._id,
                name: seller.email.split('@')[0],
                lastActive: seller.lastActive || 'Never'
            },
            restaurant: {
                id: seller.managedRestaurant._id,
                name: seller.managedRestaurant.name
            },
            performance: {
                totalProducts: productsCount,
                totalOrders: ordersCount,
                totalEarnings: earnings[0]?.total || 0,
                currency: 'EGP',
                rating: Math.round(rating * 10) / 10, // Round to 1 decimal place
                ratingStars: '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
            }
        });

    } catch (error) {
        console.error("Error in getSellerPerformance:", error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
};



