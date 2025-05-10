
const mongoose = require('mongoose');

const rejectedSellerSchema = new mongoose.Schema({
    email: { type: String, required: true },
    reason: { type: String, required: true },
    rejectedAt: { type: Date, default: Date.now },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } 
});

module.exports = mongoose.model('RejectedSeller', rejectedSellerSchema);