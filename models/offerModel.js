// models/offerModel.js
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true }, 
  //  price: { type: Number, required: true }
  price: { type: Number, required: false }
});

module.exports = mongoose.model('Offer', offerSchema);