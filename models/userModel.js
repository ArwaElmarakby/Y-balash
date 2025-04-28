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
    firstName: { type: String },
    lastName: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other'], default: null },
    birthday: { type: Date },
    profileImage: { type: String },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
    points: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    isSeller: { type: Boolean, default: false }, 
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', userSchema);