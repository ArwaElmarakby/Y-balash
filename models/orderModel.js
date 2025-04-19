// // models/orderModel.js
// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   items: [
//     {
//       itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
//       quantity: Number,
//       price: Number
//     }
//   ],
//   offers: [
//     {
//       offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
//       quantity: Number,
//       price: Number
//     }
//   ],
//   totalAmount: { type: Number, required: true },
//   shippingAddress: { type: Object, required: true },
//   paymentStatus: { type: String, default: 'pending', enum: ['pending', 'paid', 'failed', 'refunded'] },
//   orderDate: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Order', orderSchema);









// // models/orderModel.js
// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//     customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
//     products: [
//         {
//             productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', required: true },
//             quantity: { type: Number, required: true }
//         }
//     ],
//     total: { type: Number, required: true },
//     status: { type: String, enum: ['pending', 'completed', 'canceled'], default: 'pending' },
//     createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Order', orderSchema);






// models/orderModel.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image', required: true },
            quantity: { type: Number, required: true }
        }
    ],
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'canceled'], default: 'pending' },
    paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' }, // إضافة حقل حالة الدفع
    paymentIntentId: { type: String }, // لتخزين معرف الدفع من Stripe
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);