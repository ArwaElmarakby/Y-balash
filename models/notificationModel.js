const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  type: { 
    type: String, 
    enum: ['stock', 'analytics', 'order', 'general'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedItem: { type: mongoose.Schema.Types.ObjectId }, 
  metadata: { type: Object } 
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);