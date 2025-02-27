// models/favoriteModel.js
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Image' },
});

module.exports = mongoose.model('Favorite', favoriteSchema);