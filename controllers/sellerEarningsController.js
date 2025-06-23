// controllers/sellerEarningsController.js
const Restaurant = require('../models/restaurantModel');
const { logActivity } = require('./activityController');

exports.deductFromEarnings = async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const sellerId = req.user._id;

        // التحقق من صحة المبلغ
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'يجب تقديم مبلغ صحيح أكبر من الصفر'
            });
        }

        // البحث عن المطعم التابع للبائع
        const restaurant = await Restaurant.findOne({ _id: req.user.managedRestaurant });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'لم يتم العثور على المطعم'
            });
        }

        // التحقق من أن الرصيد كافي
        if (restaurant.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'الرصيد غير كافي للخصم',
                availableBalance: restaurant.balance
            });
        }

        // خصم المبلغ من الرصيد
        restaurant.balance -= parseFloat(amount);
        
        // تسجيل الحركة (اختياري)
        restaurant.transactions.push({
            type: 'deduction',
            amount,
            reason: reason || 'خصم إداري',
            date: new Date()
        });

        await restaurant.save();

        // تسجيل النشاط (اختياري)
        await logActivity('earnings_deduction', sellerId, {
            amount,
            restaurantId: restaurant._id,
            remainingBalance: restaurant.balance
        });

        res.status(200).json({
            success: true,
            message: 'تم خصم المبلغ بنجاح',
            deductedAmount: amount,
            newBalance: restaurant.balance,
            currency: 'EGP'
        });

    } catch (error) {
        console.error('Error deducting from earnings:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء معالجة الطلب',
            error: error.message
        });
    }
};