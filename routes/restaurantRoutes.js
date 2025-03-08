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
const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant, searchRestaurants } = require('../controllers/restaurantController');

router.post('/add', addRestaurant); // Image upload is handled inside the controller
router.get('/all', getRestaurants);
router.delete('/delete', deleteRestaurant);
router.put('/update', updateRestaurant); // Image upload is handled inside the controller
router.get('/search', searchRestaurants);

module.exports = router;