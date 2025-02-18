const express = require('express');
const router = express.Router();
const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant, searchRestaurants } = require('../controllers/restaurantController');

router.post('/add', addRestaurant); 
router.get('/all', getRestaurants); 
router.delete('/delete/:id', deleteRestaurant); 
router.put('/update/:id', updateRestaurant); 
router.get('/search', searchRestaurants);

module.exports = router;