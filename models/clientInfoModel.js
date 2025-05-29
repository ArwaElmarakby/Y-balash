const mongoose = require('mongoose');

const clientInfoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    country: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ClientInfo', clientInfoSchema);
