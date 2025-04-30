// const express = require('express');
// const router = express.Router();
// const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant, searchRestaurants } = require('../controllers/restaurantController');

// router.post('/add', addRestaurant); 
// router.get('/all', getRestaurants); 
// router.delete('/delete/:id', deleteRestaurant); 
// router.put('/update/:id', updateRestaurant); 
// router.get('/search', searchRestaurants);

// module.exports = router;


const express = require('express');
const router = express.Router();
const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant, searchRestaurants, getTotalOrders ,getRestaurantById, addImageToRestaurant, removeImageFromRestaurant} = require('../controllers/restaurantController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');
const Order = require('../models/orderModel');
const Restaurant = require('../models/restaurantModel');


router.post('/add', authMiddleware, adminMiddleware, addRestaurant); // Image upload is handled inside the controller
router.get('/all', getRestaurants);
router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteRestaurant);
router.put('/update/:id', authMiddleware, adminMiddleware, updateRestaurant); // Image upload is handled inside the controller
router.get('/search', searchRestaurants);
router.get('/:id/orders', getTotalOrders);
router.get('/:id', getRestaurantById);
router.post('/add-image', addImageToRestaurant);
router.delete('/remove-image', removeImageFromRestaurant);



router.get('/restaurants-balance-simple', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const restaurants = await Restaurant.find().select('name _id');
        
        const balancePromises = restaurants.map(async (restaurant) => {
            const result = await Order.aggregate([
                { $match: { restaurantId: restaurant._id, status: 'delivered' } },
                { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
            ]);
            
            return {
                restaurantId: restaurant._id,
                restaurantName: restaurant.name,
                currentBalance: result[0]?.totalRevenue || 0,
                currency: "EGP"
            };
        });

        const balances = await Promise.all(balancePromises);
        
        res.status(200).json({
            message: 'Restaurants balances retrieved successfully',
            data: balances
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
});




router.get('/my-restaurant-balance', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned' });
        }

        const result = await Order.aggregate([
            { $match: { restaurantId: seller.managedRestaurant, status: 'delivered' } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
        ]);

        const restaurant = await Restaurant.findById(seller.managedRestaurant).select('name');
        
        res.status(200).json({
            currentBalance: result[0]?.totalRevenue || 0,
            currency: "EGP"
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
});




module.exports = router;