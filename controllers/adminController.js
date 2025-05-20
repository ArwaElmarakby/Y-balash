const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Image = require('../models/imageModel');
const Category = require('../models/categoryModel');
const ApprovedSeller = require('../models/approvedSellerModel');


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


exports.getApprovedSellers = async (req, res) => {
    try {
        const approvedSellers = await ApprovedSeller.find()
            .populate('adminId', 'email')
            .populate('restaurantId', 'name')
            .sort({ approvedAt: -1 });

        res.status(200).json({
            success: true,
            count: approvedSellers.length,
            approvedSellers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch approved sellers",
            error: error.message
        });
    }
};




exports.approveSeller = async (req, res) => {
    try {
        const { email, restaurantId, additionalNotes, name, password } = req.body;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ 
                success: false,
                message: "Restaurant not found" 
            });
        }

        let user = await User.findOne({ email });
        
        if (!user) {
            user = new User({
                email,
                password: password || 'defaultPassword123', 
                name: name || 'New Seller',
                isSeller: true,
                managedRestaurant: restaurantId
            });
            
            await user.save();
        } else {
            user.isSeller = true;
            user.managedRestaurant = restaurantId;
            await user.save();
        }

        const newApprovedSeller = new ApprovedSeller({
            email,
            adminId: req.user._id,
            restaurantId,
            additionalNotes
        });

        await newApprovedSeller.save();

        res.status(201).json({
            success: true,
            message: "Seller approved successfully",
            approvedSeller: newApprovedSeller,
            user: {
                _id: user._id,
                email: user.email,
                isSeller: user.isSeller,
                managedRestaurant: restaurant.name
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error approving seller",
            error: error.message
        });
    }
};