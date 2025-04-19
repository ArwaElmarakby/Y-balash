// models/orderModel.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
      quantity: Number,
      price: Number
    }
  ],
  offers: [
    {
      offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
      quantity: Number,
      price: Number
    }
  ],
  totalAmount: { type: Number, required: true },
  shippingAddress: { type: Object, required: true },
  paymentStatus: { type: String, default: 'pending' },
  orderDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);