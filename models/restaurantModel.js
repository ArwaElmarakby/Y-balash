// 





const mongoose = require('mongoose');

// نموذج للمطعم
const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
