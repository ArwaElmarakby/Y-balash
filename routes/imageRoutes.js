// routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const { addImage, getImages, deleteImage, updateImage, searchImage, incrementViews, getBestSelling, getItemDetails, getItemsSummary } = require('../controllers/imageController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');
const sellerMiddleware = require('../middleware/sellerMiddleware');



const adminOrSellerMiddleware = (req, res, next) => {
  if (req.user.isAdmin || req.user.isSeller) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin or Seller required.' });
};


router.post('/add', authMiddleware, adminOrSellerMiddleware, addImage);// Image upload is handled inside the controller
router.get('/all', getImages);
router.delete('/delete/:id', authMiddleware, adminOrSellerMiddleware, deleteImage);
router.put('/update/:id', authMiddleware, adminOrSellerMiddleware, updateImage);// Image upload is handled inside the controller
router.get('/search', searchImage);
router.put('/view/:id', incrementViews);
router.get('/best-selling', getBestSelling);
router.post('/item-details', getItemDetails);
router.get('/summary', getItemsSummary);


module.exports = router;