// services/priceUpdateService.js
const axios = require('axios');
const Image = require('../models/imageModel');
const cron = require('node-cron');

const PREDICTION_API_URL = 'http://185.225.233.14:8001/predict_price';

async function updateProductPrices() {
  try {
    // الحصول على جميع المنتجات التي لم تنته صلاحيتها بعد
    const products = await Image.find({
      expiryDate: { $gt: new Date() }
    });

    for (const product of products) {
      try {
        // إرسال بيانات المنتج إلى نموذج التنبؤ
        const response = await axios.post(PREDICTION_API_URL, {
          production_date: product.productionDate.toISOString().split('T')[0],
          expiry_date: product.expiryDate.toISOString().split('T')[0],
          price_fresh: product.price
        });

        const predictedPrice = response.data.predicted_price;

        // تحديث سعر المنتج في قاعدة البيانات
        await Image.findByIdAndUpdate(product._id, {
          discountedPrice: predictedPrice,
          lastPriceUpdate: new Date()
        });

        console.log(`Updated price for product ${product.name}: ${predictedPrice}`);
      } catch (error) {
        console.error(`Error updating price for product ${product.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error in price update service:', error);
  }
}

// جدولة تحديث الأسعار يومياً في الساعة 2 صباحاً
function schedulePriceUpdates() {
  cron.schedule('0 2 * * *', () => {
    console.log('Running scheduled price update...');
    updateProductPrices();
  });
}

module.exports = {
  updateProductPrices,
  schedulePriceUpdates
};