// controllers/sellerController.js
const Seller = require('../models/sellerModel');

exports.getTotalSellers = async (req, res) => {
    try {
        // Get the total number of sellers
        const totalSellers = await Seller.countDocuments();

        // Get the date one month ago
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        // Get the number of sellers created in the last month
        const newSellersLastMonth = await Seller.countDocuments({ createdAt: { $gte: lastMonth } });

        // Determine if the number of sellers has increased or decreased
        let growthStatus = 'stable';
        if (newSellersLastMonth > totalSellers) {
            growthStatus = 'increased';
        } else if (newSellersLastMonth < totalSellers) {
            growthStatus = 'decreased';
        }

        res.status(200).json({
            totalSellers,
            newSellersLastMonth,
            growthStatus
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};