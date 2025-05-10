const mongoose = require('mongoose');

const approvedSellerSchema = new mongoose.Schema({
    email: { type: String, required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    approvedAt: { type: Date, default: Date.now },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
});

module.exports = mongoose.model('ApprovedSeller', approvedSellerSchema);