const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, required: true } // سيتم تخزين مسار الصورة هنا
});

module.exports = mongoose.model('Item', itemSchema);