// models/orderModel.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{ 
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' }, 
        quantity: Number,
        price: Number 
    }],
    totalAmount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card'],
        required: true
    },
    finalAmount: { type: Number }, // السعر النهائي بعد الخصم
pointsUsed: { type: Number, default: 0 }, // النقاط المستخدمة
pointsDiscount: { type: Number, default: 0 }, // قيمة الخصم من النقاط
    notifications: [{
        type: {
            type: String,
            enum: ['new_order', 'low_stock', 'payout'],
            required: true
        },
        message: String,
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);