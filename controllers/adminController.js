const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Image = require('../models/imageModel');


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
        // استعلامات متوازية لأفضل أداء
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