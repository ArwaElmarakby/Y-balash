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
    phone: String,
    gender: { type: String, enum: ['male', 'female', 'other'], default: null },
    birthday: { type: Date },
    profileImage: { type: String },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
    points: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    isSeller: { type: Boolean, default: false },
    isSellerRequested: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    managedRestaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    language: { type: String, default: null },
    plan: {
      type: String,
      enum: ['basic', 'premium'],
      default: 'basic'
  },
  status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'pending'
  },
    paymentSettings: {
        bankAccount: {
            accountNumber: String,
            accountHolderName: String,
            bankName: String
        },
        plan: {
          type: String,
          enum: ['basic', 'premium'],
          default: 'basic'
      },
      status: {
          type: String,
          enum: ['pending', 'active', 'suspended'],
          default: 'pending'
      },
      premiumExpiresAt: {
          type: Date,
          default: null
      },
        mobileWallet: {
            provider: String,
            number: String
          },
          paypalEmail: String
        },
        transactions: [{
          date: { type: Date, default: Date.now },
          amount: Number,
          method: { type: String, enum: ['bank', 'mobile', 'paypal'] },
          status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
          reference: String
        }]
      
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', userSchema);