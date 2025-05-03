const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  quantity: { type: String, required: true },
  imageUrl: { type: String, required: true },
  views: { type: Number, default: 0 },
  discount: {
    type: {
      percentage: { type: Number, min: 0, max: 100, default: 0 },
      startDate: Date,
      endDate: Date,
      stock: { type: Number, default: 0 }
    },
    required: false
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }
});

module.exports = mongoose.model('Image', imageSchema);