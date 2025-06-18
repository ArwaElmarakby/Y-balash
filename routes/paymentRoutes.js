
const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/paymentController');
const { authMiddleware } = require('./authRoutes'); 


router.post('/payment', authMiddleware, createPayment); 


router.post('/set-cash-payment', authMiddleware, async (req, res) => {
    try {
        // البحث عن آخر طلب غير مكتمل للمستخدم
        const order = await Order.findOne({
            userId: req.user._id,
            status: 'pending'
        }).sort({ createdAt: -1 });

        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'No pending order found' 
            });
        }

        // تحديث طريقة الدفع
        order.paymentMethod = 'cash';
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Payment method set to cash',
            orderId: order._id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});


module.exports = router;