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

router.post('/add', authMiddleware, adminMiddleware, addRestaurant); // Image upload is handled inside the controller
router.get('/all', getRestaurants);
router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteRestaurant);
router.put('/update/:id', authMiddleware, adminMiddleware, updateRestaurant); // Image upload is handled inside the controller
router.get('/search', searchRestaurants);
router.get('/:id/orders', getTotalOrders);
router.get('/:id', getRestaurantById);
router.post('/add-image', addImageToRestaurant);
router.delete('/remove-image', removeImageFromRestaurant);


router.get('/:id/earnings', authMiddleware, sellerMiddleware, async (req, res) => {
    const { id } = req.params; // Get restaurant ID from the URL
    try {
        const totalEarnings = await Order.aggregate([
            {
                $match: {
                    restaurantId: id,
                    status: { $ne: 'cancelled' } // Exclude cancelled orders
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

        const earnings = totalEarnings[0]?.total || 0; // Get total earnings

        res.status(200).json({
            success: true,
            totalEarnings: earnings,
            currency: 'EGP' // Specify the currency
        });
    } catch (error) {
        console.error("Error fetching total earnings:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch total earnings',
            error: error.message
        });
    }
});


module.exports = router;