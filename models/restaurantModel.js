const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, 
    imageUrl: { type: String, required: true },
    description: { type: String }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);