const mongoose = require('mongoose');

const sellerRequestSchema = new mongoose.Schema({
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String },
  createdAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
});

module.exports = mongoose.model('SellerRequest', sellerRequestSchema);