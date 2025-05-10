const mongoose = require('mongoose');

const approvedSellerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    approvedAt: { type: Date, default: Date.now },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    additionalNotes: { type: String }
});

module.exports = mongoose.model('ApprovedSeller', approvedSellerSchema);