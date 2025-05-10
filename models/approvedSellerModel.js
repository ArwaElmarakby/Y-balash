const mongoose = require('mongoose');

const approvedSellerSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: true 
  },
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  approvedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ApprovedSeller', approvedSellerSchema);