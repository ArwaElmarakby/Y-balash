const mongoose = require('mongoose');

const sellerRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  password: { type: String } // سيتم تعبئته عند الموافقة
});

module.exports = mongoose.model('SellerRequest', sellerRequestSchema);