// models/sellerRequestModel.js
const mongoose = require('mongoose');

const sellerRequestSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  credentials: {
    username: { type: String },
    password: { type: String }
  }
});

module.exports = mongoose.model('SellerRequest', sellerRequestSchema);