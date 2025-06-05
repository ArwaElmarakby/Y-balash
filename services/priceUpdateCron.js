// services/priceUpdateCron.js
const cron = require('node-cron');
const Image = require('../models/imageModel');
const { predictPrice } = require('./pricePredictionService');

exports.startPriceUpdateCron = () => {
  // Run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running price update cron job...');
    
    try {
      // Get all products that need price updates
      const products = await Image.find({
        productionDate: { $exists: true },
        expiryDate: { $exists: true }
      });
      
      for (const product of products) {
        try {
          const predictedPrice = await predictPrice({
            productionDate: product.productionDate,
            expiryDate: product.expiryDate,
            originalPrice: product.price
          });
          
          if (predictedPrice) {
            // Update the product with discounted price
            await Image.findByIdAndUpdate(product._id, {
              $set: {
                discount: {
                  percentage: calculateDiscountPercentage(product.price, predictedPrice),
                  discountedPrice: predictedPrice,
                  updatedAt: new Date()
                }
              }
            });
            
            console.log(`Updated price for product ${product._id}`);
          }
        } catch (productError) {
          console.error(`Error updating product ${product._id}:`, productError);
        }
      }
      
      console.log('Price update cron job completed');
    } catch (error) {
      console.error('Price update cron job failed:', error);
    }
  });
  
  console.log('Price update cron job scheduled to run daily at 2 AM');
};

function calculateDiscountPercentage(originalPrice, discountedPrice) {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}