// models/orderModel.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
    items: [{ 
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' }, 
        quantity: Number,
        price: Number 
    }],
    totalAmount: { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: ['cash', 'online'],
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    status: { 
        type: String, 
        enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },
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