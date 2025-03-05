// models/couponModel.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, 
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true }, 
    discountValue: { type: Number, required: true }, 
    validUntil: { type: Date, required: true }, 
});

module.exports = mongoose.model('Coupon', couponSchema);