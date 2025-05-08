const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, unique: true },
  description: { type: String },
  price: { type: String, required: true },
  quantity: { type: String, required: true },
  imageUrl: { type: String, required: true },
  views: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false },
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
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  lastStockStatus: { 
    type: String, 
    enum: ['in', 'out', null],
    default: null 
  }
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);