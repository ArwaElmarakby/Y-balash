// models/clientAddressModel.js
const mongoose = require('mongoose');

const clientAddressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fullAddress: { 
    type: String, 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  area: { 
    type: String, 
    required: true 
  },
  nearbyLandmark: { 
    type: String 
  },
  label: { 
    type: String, 
    enum: ['home', 'work', 'other'], 
    default: 'home' 
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

module.exports = mongoose.model('ClientAddress', clientAddressSchema);