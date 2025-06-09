const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    actionType: {
        type: String,
        enum: ['product_added', 'order_placed', 'stock_updated', 'new_seller', 'order_cancelled'],
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    details: {
        type: Object,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', activitySchema);