// services/pricePredictionService.js
const axios = require('axios');

exports.predictPrice = async (productData) => {
  try {
    const response = await axios.post('http://185.225.233.14:8001/predict_price', {
      production_date: productData.productionDate,
      expiry_date: productData.expiryDate,
      price_fresh: productData.originalPrice
    });
    
    return response.data.predicted_price;
  } catch (error) {
    console.error('Price prediction failed:', error.message);
    return null;
  }
};