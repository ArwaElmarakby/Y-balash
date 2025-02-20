const express = require('express');
const router = express.Router();
const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant, searchRestaurants } = require('../controllers/restaurantController');
const uploadRestaurantImage = require('../config/cloudinary');

router.post('/add', uploadRestaurantImage.single('image'), addRestaurant); 
router.get('/all', getRestaurants);
router.delete('/delete/:id', deleteRestaurant); 
router.put('/update/:id', uploadRestaurantImage.single('image'), updateRestaurant); 
router.get('/search', searchRestaurants);

module.exports = router;