const mongoose = require('mongoose');

const sellerRequestSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  restaurantName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  adminNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }
});

module.exports = mongoose.model('SellerRequest', sellerRequestSchema);