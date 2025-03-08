// routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const { addImage, getImages, deleteImage, updateImage, searchImage, incrementViews, getBestSelling, getItemDetails } = require('../controllers/imageController');

router.post('/add', addImage); // Image upload is handled inside the controller
router.get('/all', getImages);
router.delete('/delete', deleteImage);
router.put('/update', updateImage); // Image upload is handled inside the controller
router.get('/search', searchImage);
router.put('/view', incrementViews);
router.get('/best-selling', getBestSelling);
router.post('/item-details', getItemDetails);


module.exports = router;