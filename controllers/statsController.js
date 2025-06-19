
const Order = require('../models/orderModel');

exports.getTotalEarnings = async (req, res) => {
    try {
        const totalEarnings = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'cancelled' } // استبعاد الطلبات الملغاة
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

        const earnings = totalEarnings[0]?.total || 0; // إذا لم توجد أرباح، اجعلها 0

        res.status(200).json({
            success: true,
            totalEarnings: earnings,
            currency: "EGP" // أو أي عملة أخرى تستخدمها
        });
    } catch (error) {
        console.error("Error fetching total earnings:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch total earnings',
            error: error.message
        });
    }
};
