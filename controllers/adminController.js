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


function parseQuantity(qtyStr) {
    if (!qtyStr) return null;
    // Match number (integer or float) followed by optional space and unit string
    const match = qtyStr.trim().toLowerCase().match(/^([\d\.]+)\s*([a-zA-Z]+)?/);
    if (!match) return null;
    return {
        value: parseFloat(match[1]),
        unit: match[2] || '' // unit might be undefined
    };
}


exports.getLowStockItemsByUnit = async (req, res) => {
    try {
        // Fetch all items with populated category for name
        const items = await Image.find({})
            .populate('category', 'name');
        if (!items.length) {
            return res.status(404).json({ message: 'لا توجد عناصر' });
        }
        // Thresholds defined for different units and general counts
        const thresholds = {
            // Unit: threshold value (less than)
            'kg': 1,          // less than 1 kilogram
            'gm': 250,        // less than 250 grams
            'g': 250,         // shorthand for grams
            'gram': 250,
            'grams': 250,
            'piece': 15,      // less than 15 pieces
            'pieces': 15,
            'loaf': 15,
            'loaves': 15,
            'liter': 1,
            'litre': 1,
            'bottle': 15,
            'bottles': 15,
            'bag': 15,
            'unit': 15,       // generic unit count threshold
            '' : 15            // no unit treated as count threshold less than 15
        };
        // Function to decide if item is low stock based on parsed quantity
        function isLowStock(quantityStr) {
            const parsed = parseQuantity(quantityStr);
            if (!parsed) return false;
            const { value, unit } = parsed;
            // Normalize unit for comparison (singular)
            let normalizedUnit = unit.toLowerCase();
            if (normalizedUnit.endsWith('s')) {
                normalizedUnit = normalizedUnit.slice(0, -1);
            }
            // Special case for kg vs gm/litres (convert to numeric unit for easier comparison)
            if (normalizedUnit === 'kg') {
                // threshold is 1 kg -> value < 1
                return value < thresholds['kg'];
            } else if (['gm','g','gram','grams'].includes(normalizedUnit)) {
                // threshold 250 gm
                return value < thresholds['gm'];
            } else if (normalizedUnit === 'liter' || normalizedUnit === 'litre') {
                // threshold 1 liter
                return value < thresholds['liter'];
            } else if (['piece','loaf','bottle','bag','unit'].includes(normalizedUnit)) {
                return value < thresholds[normalizedUnit];
            } else if (normalizedUnit === '') {
                // no unit: treat as general count threshold 15
                return value < thresholds[''];
            } else {
                // Unit not in thresholds, ignore (not low stock)
                return false;
            }
        }
        // Filter items matching low stock condition
        const lowStockItems = items.filter(item => isLowStock(item.quantity));
        if (lowStockItems.length === 0) {
            return res.status(404).json({ message: 'لا توجد عناصر ذات مخزون منخفض بناءً على المعايير المحددة' });
        }
        // Format response
        const formattedItems = lowStockItems.map(item => {
            const parsed = parseQuantity(item.quantity) || {value: item.quantity, unit: ''};
            return {
                name: item.name,
                category: item.category ? item.category.name : 'غير مصنف',
                remainingQuantity: item.quantity,
                quantityValue: parsed.value,
                quantityUnit: parsed.unit
            };
        });

         res.status(200).json({
            success: true,
            count: formattedItems.length,
            items: formattedItems
        });
    } catch (error) {
        console.error("Error fetching low stock items by unit:", error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الخادم',
            error: error.message
        });
    }
};