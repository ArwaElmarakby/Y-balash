const mongoose = require('mongoose');

const sellerRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    requestedPassword: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNotes: { type: String },
    approvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('SellerRequest', sellerRequestSchema);