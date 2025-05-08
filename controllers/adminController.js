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



exports.getSellerStats = async (req, res) => {
    const { sellerId } = req.params;

    try {
        // البحث عن البائع
        const seller = await User.findById(sellerId);
        if (!seller || !seller.isSeller) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        // الحصول على عدد المنتجات
        const totalProducts = await Image.countDocuments({ 
            restaurant: seller.managedRestaurant 
        });

        // الحصول على عدد الطلبات
        const totalOrders = await Order.countDocuments({ 
            restaurantId: seller.managedRestaurant 
        });

        // الحصول على إجمالي الأرباح
        const earningsResult = await Order.aggregate([
            { 
                $match: { 
                    restaurantId: seller.managedRestaurant,
                    status: 'delivered'
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    totalEarnings: { $sum: "$totalAmount" } 
                } 
            }
        ]);

        const totalEarnings = earningsResult[0]?.totalEarnings || 0;

        // يمكنك إضافة حساب التقييم هنا إذا كان لديك نظام تقييم
        const sellerRating = 4.5; // مثال - يمكنك استبداله ببيانات حقيقية

        // آخر نشاط (آخر تحديث للحساب)
        const lastActive = seller.updatedAt;

        res.status(200).json({
            sellerId,
            totalProducts,
            totalOrders,
            totalEarnings: `${totalEarnings.toFixed(2)} EGP`,
            sellerRating,
            lastActive
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};