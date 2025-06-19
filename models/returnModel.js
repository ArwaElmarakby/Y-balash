const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  reason: { type: String },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Return', returnSchema);