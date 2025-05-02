// const mongoose = require('mongoose');

// const restaurantSchema = new mongoose.Schema({
//     name: { type: String, required: true, unique: true }, 
//     imageUrl: { type: String, required: true }
// });

// module.exports = mongoose.model('Restaurant', restaurantSchema);

const mongoose = require('mongoose');



const refundSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  status: { 
    type: String, 
    enum: ['pending', 'processed', 'rejected'],
    default: 'pending'
  }
});


const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  balance: { type: Number, default: 0 },
  pendingWithdrawal: { type: Number, default: 0 },
  payouts: [{
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, required: true }, 
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' }
  }],
  refunds: [refundSchema]
});

module.exports = mongoose.model('Restaurant', restaurantSchema);