// const mongoose = require('mongoose');

// const restaurantSchema = new mongoose.Schema({
//     name: { type: String, required: true, unique: true }, 
//     imageUrl: { type: String, required: true }
// });

// module.exports = mongoose.model('Restaurant', restaurantSchema);

const mongoose = require('mongoose');


const refundSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: 1
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    required: true
  },
  reason: {
    type: String,
    maxlength: 500
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { _id: true });



const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  balance: { type: Number, default: 0 },
  pendingWithdrawal: { type: Number, default: 0 },
  payouts: [{
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true }, 
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' }
  }],
  refunds: [refundSchema], 
    timestamps: true,
    strict: true
  
});

restaurantSchema.index({ 'refunds.date': 1 });

// module.exports = mongoose.model('Restaurant', restaurantSchema);
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;