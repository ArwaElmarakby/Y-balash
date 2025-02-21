// routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const { addImage, getImages, deleteImage, updateImage, searchImage, incrementViews, getBestSelling } = require('../controllers/imageController');

router.post('/add', addImage); // Image upload is handled inside the controller
router.get('/all', getImages);
router.delete('/delete/:id', deleteImage);
router.put('/update/:id', updateImage); // Image upload is handled inside the controller
router.get('/search', searchImage);
router.put('/view/:id', incrementViews);
router.get('/best-selling', getBestSelling);


module.exports = router;