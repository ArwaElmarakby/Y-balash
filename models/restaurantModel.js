// const mongoose = require('mongoose');

// const restaurantSchema = new mongoose.Schema({
//     name: { type: String, required: true, unique: true }, 
//     imageUrl: { type: String, required: true }
// });

// module.exports = mongoose.model('Restaurant', restaurantSchema);

const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  balance: { type: Number, default: 0 },
  pendingWithdrawal: { type: Number, default: 0 },
  payouts: [payoutSchema]
});



const payoutSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['Bank Transfer', 'PayPal', 'Vodafone Cash', 'Other'],
    required: true 
  },
  status: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'pending'
  }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);