const { logActivity } = require('./activityController');


await logActivity('order_placed', order.userId, {
    orderId: order._id,
    amount: order.totalAmount
});


// إنشاء طلب دفع كاش
exports.createCashOrder = async (req, res) => {
    const userId = req.user._id;

    try {
        // الحصول على عربة التسوق الخاصة بالمستخدم
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');

        if (!cart || (cart.items.length === 0 && cart.offers.length === 0)) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // حساب المبلغ الإجمالي
        let totalAmount = 0;
        
        // حساب سعر العناصر
        cart.items.forEach(item => {
            totalAmount += item.quantity * parseFloat(item.itemId.price);
        });

        // حساب سعر العروض
        cart.offers.forEach(offer => {
            totalAmount += offer.quantity * parseFloat(offer.offerId.price);
        });

        // إضافة تكاليف الشحن والضرائب
        const shippingCost = 50;
        const importCharges = totalAmount * 0.1;
        totalAmount += shippingCost + importCharges;

        // إنشاء الطلب
        const order = new Order({
            userId,
            restaurantId: cart.items[0]?.itemId?.restaurant || cart.offers[0]?.offerId?.restaurant,
            items: cart.items.map(item => ({
                itemId: item.itemId._id,
                quantity: item.quantity,
                price: item.itemId.price
            })),
            offers: cart.offers.map(offer => ({
                offerId: offer.offerId._id,
                quantity: offer.quantity,
                price: offer.offerId.price
            })),
            totalAmount,
            paymentMethod: 'cash',
            status: 'pending'
        });

        await order.save();

        // تفريغ عربة التسوق
        await Cart.findOneAndDelete({ userId });

        res.status(201).json({
            message: 'Cash order created successfully',
            order
        });

    } catch (error) {
        console.error('Error creating cash order:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// تأكيد الدفع النقدي من البائع
exports.confirmCashPayment = async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to you' });
        }

        // البحث عن أول طلب معلق لهذا المطعم
        const order = await Order.findOneAndUpdate(
            { 
                restaurantId: seller.managedRestaurant,
                paymentMethod: 'cash',
                status: 'pending'
            },
            { status: 'paid' },
            { new: true }
        ).populate('userId', 'email phone');

        if (!order) {
            return res.status(404).json({ message: 'No pending cash orders found' });
        }

        res.status(200).json({
            message: 'Cash payment confirmed successfully',
            order
        });

    } catch (error) {
        console.error('Error confirming cash payment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};