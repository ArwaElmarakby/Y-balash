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
  earnings: [{
    month: { type: String }, 
    amount: { type: Number, default: 0 }
  }],
  balance: { type: Number, default: 0 },
  pendingWithdrawal: { type: Number, default: 0 }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);