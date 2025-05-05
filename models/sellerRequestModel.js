// models/sellerRequestModel.js
const mongoose = require('mongoose');

const sellerRequestSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    restaurantName: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SellerRequest', sellerRequestSchema);