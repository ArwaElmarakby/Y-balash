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



// exports.getTopCategories = async (req, res) => {
//     try {
//         const topCategories = await Category.aggregate([
//             {
//                 $lookup: {
//                     from: "images",
//                     localField: "items",
//                     foreignField: "_id",
//                     as: "products"
//                 }
//             },
//             {
//                 $project: {
//                     name: 1,
//                     productCount: { $size: "$products" }
//                 }
//             },
//             { $sort: { productCount: -1 } },
//             { $limit: 3 }
//         ]);

//         res.status(200).json({
//             success: true,
//             topCategories
//         });
//     } catch (error) {
//         console.error("Error fetching top categories:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to fetch top categories",
//             error: error.message
//         });
//     }
// };



exports.getTopCategories = async (req, res) => {
    try {
        const now = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        // Get current month top categories
        const currentMonthCategories = await Category.aggregate([
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

        // Get last month counts for comparison
        const lastMonthCategories = await Category.aggregate([
            {
                $lookup: {
                    from: "images",
                    let: { categoryItems: "$items" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ["$_id", "$$categoryItems"] },
                                createdAt: { $lt: now, $gte: lastMonth }
                            }
                        }
                    ],
                    as: "lastMonthProducts"
                }
            },
            {
                $project: {
                    name: 1,
                    lastMonthCount: { $size: "$lastMonthProducts" }
                }
            }
        ]);

        // Combine data and calculate percentage change
        const topCategoriesWithChange = currentMonthCategories.map(category => {
            const lastMonthData = lastMonthCategories.find(c => c._id.toString() === category._id.toString());
            const lastMonthCount = lastMonthData?.lastMonthCount || 0;
            
            let percentageChange = 0;
            if (lastMonthCount > 0) {
                percentageChange = ((category.productCount - lastMonthCount) / lastMonthCount) * 100;
            } else if (category.productCount > 0) {
                percentageChange = 100; // If no products last month, consider it 100% increase
            }

            return {
                ...category,
                percentageChange: percentageChange.toFixed(2) + '%',
                changeDirection: percentageChange >= 0 ? 'increase' : 'decrease'
            };
        });

        res.status(200).json({
            success: true,
            topCategories: topCategoriesWithChange
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
        const { email, restaurantId, additionalNotes, name, password, phone } = req.body;

        const existingApproval = await ApprovedSeller.findOne({ email });
        if (existingApproval) {
            return res.status(400).json({
                success: false,
                message: "Seller already approved",
                existingApproval
            });
        }
        
        
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ 
                success: false,
                message: "Restaurant not found" 
            });
        }

        
        let user = await User.findOne({ email });
        
        if (!user) {
            
            if (!name || !password || !phone) {
                return res.status(400).json({
                    success: false,
                    message: "Name, password and phone are required"
                });
            }

            user = new User({
                email,
                name,
                password, 
                phone: phone || "0000000000",
                isSeller: true,
                managedRestaurant: restaurantId
            });
        } else {
        
            user.isSeller = true;
            user.managedRestaurant = restaurantId;
        }

        
        const newApprovedSeller = new ApprovedSeller({
            email,
            adminId: req.user._id,
            restaurantId,
            restaurantName: restaurant.name,
            additionalNotes
        });

        await Promise.all([
            user.save(),
            newApprovedSeller.save()
        ]);

        res.status(201).json({
            success: true,
            message: "Seller approved successfully",
            data: {
                seller: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    isSeller: user.isSeller,
                    restaurant: {
                        id: restaurant._id,
                        name: restaurant.name
                    }
                },
                approvalRecord: {
                    id: newApprovedSeller._id,
                    approvedAt: newApprovedSeller.approvedAt,
                    approvedBy: newApprovedSeller.adminId
                }
            }
        });

    } catch (error) {
        console.error("Error in approveSeller:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};