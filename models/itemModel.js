const mongoose = require('mongoose');

// تعريف schema للعنصر (Item)
const itemSchema = new mongoose.Schema({
    name: { type: String, required: true }, // اسم العنصر
    price: { type: Number, required: true }, // سعر العنصر
    quantity: { type: Number, required: true }, // كمية العنصر
    image: { type: String, required: true } // رابط الصورة (سيتم تخزينه من Cloudinary)
});

// تصدير النموذج (Model) باسم "Item"
module.exports = mongoose.model('Item', itemSchema);