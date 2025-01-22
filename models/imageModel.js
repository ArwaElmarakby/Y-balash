const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: String, required: true } ,
    quantity: { type: String, required: true }, 
    imageUrl: { type: String, required: true },
    views: { type: Number, default: 0 }
    
    
});

module.exports = mongoose.model('Image', imageSchema);