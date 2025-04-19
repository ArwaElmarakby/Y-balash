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
const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant, searchRestaurants, getTotalOrders ,getRestaurantById} = require('../controllers/restaurantController');

router.post('/add', addRestaurant); // Image upload is handled inside the controller
router.get('/all', getRestaurants);
router.delete('/delete/:id', deleteRestaurant);
router.put('/update/:id', updateRestaurant); // Image upload is handled inside the controller
router.get('/search', searchRestaurants);
router.get('/:id/orders', getTotalOrders);
router.get('/:id', getRestaurantById);

module.exports = router;