const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Image = require('../models/imageModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');

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
        // 1. Get Seller Info
        const seller = await User.findById(sellerId)
            .select('isSeller managedRestaurant lastActive')
            .populate('managedRestaurant', 'name');

        if (!seller || !seller.isSeller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to this seller' });
        }

        // 2. Calculate Performance Metrics
        const [totalProducts, totalOrders, totalEarnings] = await Promise.all([
            // Total Products
            Image.countDocuments({ restaurant: seller.managedRestaurant._id }),

            // Total Orders
            Order.countDocuments({ 
                restaurantId: seller.managedRestaurant._id,
                status: { $ne: 'cancelled' }
            }),

            // Total Earnings
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

        // 3. Calculate Seller Rating (Example: average of 4.5 if no rating system exists)
        const sellerRating = 4.5; // You can replace this with actual rating calculation

        // 4. Prepare Response
        const performanceData = {
            seller: {
                id: seller._id,
                name: seller.email.split('@')[0], // Using email prefix as name
                lastActive: seller.lastActive || 'Not available'
            },
            restaurant: {
                id: seller.managedRestaurant._id,
                name: seller.managedRestaurant.name
            },
            performance: {
                totalProducts,
                totalOrders,
                totalEarnings: totalEarnings[0]?.total || 0,
                currency: 'EGP',
                sellerRating,
                lastUpdated: new Date()
            }
        };

        res.status(200).json(performanceData);

    } catch (error) {
        console.error("Error fetching seller performance:", error);
        res.status(500).json({ message: 'Server error', error });
    }
};