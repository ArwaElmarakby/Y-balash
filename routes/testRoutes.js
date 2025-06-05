// routes/testRoutes.js
const express = require('express');
const router = express.Router();
const { predictPrice } = require('../services/pricePredictionService');

router.post('/test-price-prediction', async (req, res) => {
  try {
    const { productionDate, expiryDate, originalPrice } = req.body;
    
    const predictedPrice = await predictPrice({
      productionDate,
      expiryDate,
      originalPrice
    });
    
    res.json({
      success: true,
      originalPrice,
      predictedPrice,
      discountPercentage: predictedPrice 
        ? Math.round(((originalPrice - predictedPrice) / originalPrice) * 100)
        : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Price prediction failed',
      error: error.message
    });
  }
});

module.exports = router;