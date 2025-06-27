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
const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant, searchRestaurants, getTotalOrders ,getRestaurantById, addImageToRestaurant, removeImageFromRestaurant, getRestaurantProducts} = require('../controllers/restaurantController');
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
router.get('/:id/products', authMiddleware, sellerMiddleware, getRestaurantProducts);


module.exports = router;