// models/locationModel.js
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, 
    latitude: { type: Number, required: true }, 
    longitude: { type: Number, required: true }, 
    address: { type: String, required: true }, 
});

module.exports = mongoose.model('Location', locationSchema);