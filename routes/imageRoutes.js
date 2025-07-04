// routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const { addImage, getImages, deleteImage, updateImage, searchImage, incrementViews, getBestSelling, getItemDetails, getItemsSummary, getTotalProducts  } = require('../controllers/imageController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');
const sellerMiddleware = require('../middleware/sellerMiddleware');

router.post('/add', authMiddleware, addImage); // Image upload is handled inside the controller
router.get('/all', getImages);
router.delete('/delete/:id', authMiddleware, deleteImage);
router.put('/update/:id', authMiddleware, updateImage); // Image upload is handled inside the controller
router.get('/search', searchImage);
router.put('/view/:id', incrementViews);
router.get('/best-selling', getBestSelling);
router.post('/item-details', getItemDetails);
router.get('/summary', getItemsSummary);
router.get('/total', getTotalProducts);


module.exports = router;