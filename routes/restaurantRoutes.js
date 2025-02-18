const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); 
const Restaurant = require('../models/restaurantModel');
const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant, searchRestaurants } = require('../controllers/restaurantController');


//  Multer  Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'restaurants', //  Cloudinary
      allowedFormats: ['jpg', 'jpeg', 'png'],
    },
  });
  
  const upload = multer({ storage: storage });
  
  // upload restaurant photo
  router.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'upload photo  ' });
    }
  
    try {
      // 
      const restaurant = await Restaurant.create({
        name: req.body.name,
        imageUrl: req.file.path, 
    
      });
  
      res.status(200).json({
        message: '  The image of the restaurant has been uploaded successfully  ',
        restaurant: restaurant,
      });
    } catch (error) {
      res.status(500).json({ message: ' An error occurred while uploading the restaurant image  ', error });
    }
  });


router.post('/add', addRestaurant); 
router.get('/all', getRestaurants); 
router.delete('/delete/:id', deleteRestaurant); 
router.put('/update/:id', updateRestaurant); 
router.get('/search', searchRestaurants);

module.exports = router;