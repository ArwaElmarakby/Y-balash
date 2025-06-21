
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const Cart = require('../models/cartModel'); 

// exports.createPayment = async (req, res) => {
//     const userId = req.user.id; 

//     try {
      
//         const cart = await Cart.findOne({ userId }).populate('items.itemId');
//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found' });
//         }

       
//         let totalAmount = 0;
//         cart.items.forEach(item => {
//             totalAmount += item.quantity * parseFloat(item.itemId.price);
//         });

        
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: totalAmount * 100, 
//             currency: 'usd', 
//             payment_method_types: ['card'], 
//             metadata: {
//                 userId: userId, 
//             },
//         });

//         res.status(200).json({ clientSecret: paymentIntent.client_secret });
//     } catch (error) {
//         res.status(500).json({ message: 'Payment failed', error: error.message });
//     }
// };








// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const Cart = require('../models/cartModel'); 

// exports.createPayment = async (req, res) => {
//     const userId = req.user.id; 

//     try {
//         const cart = await Cart.findOne({ userId })
//             .populate('items.itemId')
//             .populate('offers.offerId');
//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found' });
//         }

//         // Calculate total items price
//         let totalItemsPrice = 0;
//         cart.items.forEach(item => {
//             totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
//         });

//         // Calculate total offers price
//         let totalOffersPrice = 0;
//         cart.offers.forEach(offer => {
//             totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
//         });

//         // Additional costs
//         const shippingCost = 50; 
//         const importCharges = (totalItemsPrice + totalOffersPrice) * 0.1; 

//         // Total price calculation
//         const totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

//         // Create payment intent with the total price
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: totalPrice * 100, // Convert to cents
//             currency: 'usd', 
//             payment_method_types: ['card'], 
//             metadata: {
//                 userId: userId, 
//             },
//         });

//         res.status(200).json({ clientSecret: paymentIntent.client_secret });
//     } catch (error) {
//         res.status(500).json({ message: 'Payment failed', error: error.message });
//     }
// };









const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Cart = require('../models/cartModel'); 
const Order = require('../models/orderModel');
const { createNotification } = require('./notificationController');
const Restaurant = require('../models/restaurantModel');
const Image = require('../models/imageModel');

// exports.createPayment = async (req, res) => {
//     const userId = req.user.id; 

//     try {
//         const cart = await Cart.findOne({ userId })
//             .populate('items.itemId')
//             .populate('offers.offerId');
//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found' });
//         }

//         // Calculate total items price
//         let totalItemsPrice = 0;
//         cart.items.forEach(item => {
//             totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
//         });

//         // Calculate total offers price
//         let totalOffersPrice = 0;
//         cart.offers.forEach(offer => {
//             totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
//         });

//         // Additional costs
//         const shippingCost = 50; 
//         const importCharges = totalItemsPrice / 4; // Calculate import charges as 1/4 of total items price

//         // Total price calculation
//         const totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

//         // Create payment intent with the total price
//         const amount = Math.round(totalPrice * 100);
//         const paymentIntent = await stripe.paymentIntents.create({
//             // amount: totalPrice * 100, // Convert to cents
//             amount: amount,
//             currency: 'egp', 
//             payment_method_types: ['card'], 
//             metadata: {
//                 userId: userId, 
//             },
//         });

//         res.status(200).json({ clientSecret: paymentIntent.client_secret });
//     } catch (error) {
//         res.status(500).json({ message: 'Payment failed', error: error.message });
//     }
// };


async function updateProductQuantities(items) {
  try {
    for (const item of items) {
      const product = await Image.findById(item.itemId);
      if (product) {
        const currentQuantity = parseInt(product.quantity);
        const newQuantity = currentQuantity - item.quantity;
        
        // تأكد من عدم وجود كمية سالبة
        product.quantity = Math.max(0, newQuantity).toString();
        await product.save();
      }
    }
  } catch (error) {
    console.error('Error updating product quantities:', error);
    throw error;
  }
}


exports.createPayment = async (req, res) => {
    const userId = req.user._id; // استخدام req.user._id بدلاً من req.user.id

    try {
        // 1. احصلي على سلة التسوق مع العناصر والعروض
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');
        
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // 2. حساب السعر الإجمالي
        let totalItemsPrice = 0;
        cart.items.forEach(item => {
            totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
        });

        let totalOffersPrice = 0;
        cart.offers.forEach(offer => {
            totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
        });

        const shippingCost = 50;
        const importCharges = (totalItemsPrice + totalOffersPrice) * 0.1;
        const totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

        // 3. تحديث سعر السلة في قاعدة البيانات (اختياري)
        cart.totalPrice = totalPrice;
        await cart.save();

        // 4. إنشاء paymentIntent في Stripe بنفس السعر
        const amount = Math.round(totalPrice * 100); // تحويل السعر إلى سنتات
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'egp',
            payment_method_types: ['card'],
            metadata: {
                userId: userId.toString(),
                cartId: cart._id.toString()
            },
        });

        res.status(200).json({ 
            clientSecret: paymentIntent.client_secret,
            totalPrice: totalPrice // إرسال السعر للواجهة الأمامية للتأكيد
        });
    } catch (error) {
        console.error("Error in createPayment:", error);
        res.status(500).json({ 
            message: 'Payment failed', 
            error: error.message 
        });
    }
};



// exports.cashPayment = async (req, res) => {
//     const userId = req.user.id;

//     try {
//         const cart = await Cart.findOne({ userId })
//             .populate('items.itemId')
//             .populate('offers.offerId');
//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found' });
//         }

//         // Retrieve restaurantId from items or offers
//         let restaurantId = null;
//         if (cart.items.length > 0) {
//             restaurantId = cart.items[0].itemId.restaurant || null;
//         } 
//         if (!restaurantId && cart.offers.length > 0) {
//             restaurantId = cart.offers[0].offerId.restaurant || null;
//         }
//         if (!restaurantId) {
//             return res.status(400).json({ message: 'Unable to determine restaurant from cart items/offers' });
//         }

//         // Calculate total items price
//         let totalItemsPrice = 0;
//         cart.items.forEach(item => {
//             totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
//         });

//         // Calculate total offers price
//         let totalOffersPrice = 0;
//         cart.offers.forEach(offer => {
//             totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
//         });

//         // Additional costs
//         const shippingCost = 50; 
//         const importCharges = (totalItemsPrice + totalOffersPrice) * 0.1;// Calculate import charges as 1/4 of total items price

//         // Total price calculation
//         const totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

//         // Create an order
//         // const order = new Order({
//         //     userId: userId,
//         //     restaurantId: restaurantId,
//         //     items: cart.items,
//         //     totalAmount: totalPrice,
//         //     status: 'pending', // Set initial status to pending
//         //     paymentMethod: 'cash' 
//         // });


//         const order = new Order({
//             userId: userId,
//             restaurantId: restaurantId,
//             items: cart.items.map(item => ({
//                 itemId: item.itemId._id,
//                 quantity: item.quantity,
//                 price: item.itemId.price
//             })),
//             totalAmount: totalPrice,
//             status: 'pending',
//             paymentMethod: 'cash' 
//         });

//         await order.save();

//         await updateProductQuantities(cart.items);

        
//           await createNotification(
//             req.user._id,
//             restaurantId,
//             'new_order',
//             'New Order Received',
//             `New cash order #${order._id} for ${totalPrice} EGP`,
//             order._id
//         );

//         // Clear the cart after payment
//         await Cart.deleteOne({ userId });

//         res.status(200).json({ message: 'Cash payment initiated successfully', orderId: order._id });
//     } catch (error) {
//         res.status(500).json({ message: 'Cash payment failed', error: error.message });
//     }
// };




exports.cashPayment = async (req, res) => {
    const userId = req.user._id; // يتم الحصول على الـ userId من التوكن مباشرةً

    try {
        // 1. البحث عن سلة التسوق الخاصة بالمستخدم
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');
        
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for this user' });
        }

        // 2. حساب السعر الإجمالي
        let totalItemsPrice = 0;
        cart.items.forEach(item => {
            totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
        });

        let totalOffersPrice = 0;
        cart.offers.forEach(offer => {
            totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
        });

        const shippingCost = 50;
        const importCharges = (totalItemsPrice + totalOffersPrice) * 0.1;
        let totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

        // 3. حساب النقاط المستخدمة (إذا كان المستخدم لديه نقاط)
        const user = await User.findById(userId);
        let pointsUsed = 0;
        let discountFromPoints = 0;

        if (user.points >= 10) { // إذا كان لدى المستخدم 10 نقاط أو أكثر (10 نقاط = 3 جنيه)
            const possibleDiscounts = Math.floor(user.points / 10); // عدد المرات التي يمكن فيها استخدام 10 نقاط
            discountFromPoints = possibleDiscounts * 3; // الخصم الإجمالي بالنقاط
            pointsUsed = possibleDiscounts * 10; // النقاط المستخدمة

            // تطبيق الخصم على السعر الإجمالي
            totalPrice -= discountFromPoints;

            // خصم النقاط من رصيد المستخدم
            user.points -= pointsUsed;
            await user.save();
        }

        // 4. إنشاء الطلب
        const order = new Order({
            userId: userId,
            restaurantId: cart.items[0]?.itemId?.restaurant || null, // افتراض أن كل العناصر تابعة لنفس المطعم
            items: cart.items.map(item => ({
                itemId: item.itemId._id,
                quantity: item.quantity,
                price: item.itemId.price
            })),
            totalAmount: totalPrice,
            status: 'pending',
            paymentMethod: 'cash',
            pointsUsed: pointsUsed // حفظ النقاط المستخدمة في الطلب (اختياري)
        });

        await order.save();

        // 5. تحديث كميات المنتجات
        await updateProductQuantities(cart.items);

        // 6. حذف سلة التسوق بعد اكتمال الطلب
        await Cart.deleteOne({ userId });

        res.status(200).json({ 
            success: true,
            message: 'Cash payment successful',
            orderId: order._id,
            pointsUsed: pointsUsed, // النقاط المستخدمة
            discountFromPoints: discountFromPoints, // الخصم من النقاط (بالجنيه)
            totalAmount: totalPrice // السعر النهائي بعد الخصم
        });

    } catch (error) {
        console.error("Error in cashPayment:", error);
        res.status(500).json({ 
            success: false,
            message: 'Cash payment failed',
            error: error.message 
        });
    }
};
