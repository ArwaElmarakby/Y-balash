const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  description: { type: String }, 
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }]
});

module.exports = mongoose.model('Category', categorySchema);