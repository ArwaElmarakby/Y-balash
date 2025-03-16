const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', unique: true },
    profileImage: { type: String }, 
    name: { type: String }, 
    email: { type: String, required: true, unique: true }, 
    gender: { type: String, enum: ['male', 'female', 'other'] }, 
    birthday: { type: Date }, 
    phoneNumber: { type: String } 
});

module.exports = mongoose.model('UserProfile', userProfileSchema);