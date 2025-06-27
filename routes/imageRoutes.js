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
router.get('/restaurant/:restaurantId/products', async (req, res) => {
  const { restaurantId } = req.params;

  try {
    const products = await Image.find({ restaurant: restaurantId })
      .populate('category', 'name') // Populate category name if needed
      .select('name price imageUrl quantity category');

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No products found for this restaurant' });
    }

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


module.exports = router;