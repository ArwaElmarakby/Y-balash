const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  country: { type: String, required: true },
  streetName: { type: String, required: true },
  buildingNameNo: { type: String, required: true },
  cityArea: { type: String, required: true },
  governorate: { type: String, required: true },
  nearestLandmark: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);