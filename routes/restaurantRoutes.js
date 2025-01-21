const express = require('express');
const router = express.Router();
const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant } = require('../controllers/restaurantController');

router.post('/add', addRestaurant); 
router.get('/all', getRestaurants); 
router.delete('/delete/:id', deleteRestaurant); 
router.put('/update/:id', updateRestaurant); 

module.exports = router;