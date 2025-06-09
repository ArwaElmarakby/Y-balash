// models/activityLogModel.js
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    action: { type: String, required: true }, // نوع النشاط (مثل: product added, order placed)
    details: { type: String, required: true }, // تفاصيل النشاط
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ' }, // معرف المستخدم الذي قام بالنشاط
    createdAt: { type: Date, default: Date.now } // تاريخ ووقت النشاط
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
