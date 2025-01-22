const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true } ,
    quantity: { type: Number, required: true }, 
    imageUrl: { type: String, required: true },
    views: { type: Number, default: 0 }
    
    
});

module.exports = mongoose.model('Image', imageSchema);