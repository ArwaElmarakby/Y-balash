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
        // 1. التحقق من صحة ID البائع
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({ message: 'Invalid seller ID format' });
        }

        // 2. جلب بيانات البائع
        const seller = await User.findById(sellerId)
            .select('isSeller managedRestaurant lastActive email')
            .lean();
        
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        if (!seller.isSeller) {
            return res.status(400).json({ message: 'User is not a seller' });
        }

        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                message: 'Seller has no assigned restaurant',
                performance: null
            });
        }

        // 3. جلب بيانات المطعم
        const restaurant = await Restaurant.findById(seller.managedRestaurant)
            .select('name')
            .lean();

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // 4. جلب الإحصائيات بشكل آمن
        const [productsCount, ordersCount, earningsResult, ratingResult] = await Promise.all([
            Image.countDocuments({ restaurant: seller.managedRestaurant }).maxTimeMS(5000),
            Order.countDocuments({ restaurantId: seller.managedRestaurant }).maxTimeMS(5000),
            Order.aggregate([
                { $match: { 
                    restaurantId: seller.managedRestaurant,
                    status: { $ne: 'cancelled' }
                }},
                { $group: { 
                    _id: null, 
                    total: { $sum: "$totalAmount" }
                }}
            ]).maxTimeMS(5000),
            Order.aggregate([
                { $match: { 
                    restaurantId: seller.managedRestaurant,
                    rating: { $exists: true, $gte: 1, $lte: 5 }
                }},
                { $group: { 
                    _id: null, 
                    averageRating: { $avg: "$rating" },
                    ratingCount: { $sum: 1 }
                }}
            ]).maxTimeMS(5000)
        ]);

        // 5. معالجة النتائج
        const earnings = earningsResult[0]?.total || 0;
        const ratingInfo = ratingResult[0] || { averageRating: 0, ratingCount: 0 };
        const rating = parseFloat(ratingInfo.averageRating.toFixed(1));
        const fullStars = Math.round(rating);
        
        // 6. إرسال الرد
        res.status(200).json({
            success: true,
            seller: {
                id: seller._id,
                name: seller.email.split('@')[0],
                lastActive: seller.lastActive || 'Unknown'
            },
            restaurant: {
                id: seller.managedRestaurant,
                name: restaurant.name
            },
            stats: {
                totalProducts: productsCount,
                totalOrders: ordersCount,
                totalEarnings: earnings,
                currency: 'EGP',
                rating: rating,
                ratingCount: ratingInfo.ratingCount,
                ratingStars: '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars)
            }
        });

    } catch (error) {
        console.error('Error in getSellerPerformance:', error);
        
        // تحديد نوع الخطأ
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid ID format'
            });
        } else if (error.name === 'MongoTimeoutError') {
            return res.status(504).json({ 
                success: false,
                message: 'Database query timeout'
            });
        }

        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
