// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

// const userSchema = new mongoose.Schema({
//     email: { type: String, required: true, unique: true },
//     phone: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
// });

// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next();
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
// });

// module.exports = mongoose.model('User', userSchema);






const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    // email: { type: String, required: true, unique: true },
    // phone: { type: String, required: true, unique: true },
    // password: { type: String, required: true },
    googleId: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Not specified' },
    birthday: { type: Date },
    imageUrl: { type: String }, 
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', userSchema);