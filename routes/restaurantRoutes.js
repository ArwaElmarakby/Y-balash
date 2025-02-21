const express = require('express');
const router = express.Router();
const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant, searchRestaurants } = require('../controllers/restaurantController');
const upload = require('../config/cloudinary').upload;

router.post('/add', upload.single('image'), addRestaurant);
router.get('/all', getRestaurants); 
router.delete('/delete/:id', deleteRestaurant); 
router.put('/update/:id', upload.single('image'), updateRestaurant); 
router.get('/search', searchRestaurants);

module.exports = router;