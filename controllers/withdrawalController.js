const Withdrawal = require('../models/withdrawalModel');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');

exports.requestWithdrawal = async (req, res) => {
    const { amount } = req.body;
    const seller = req.user;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    try {
        const restaurant = await Restaurant.findById(seller.managedRestaurant);
        if (!restaurant || restaurant.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const withdrawalRequest = new Withdrawal({
            sellerId: seller._id,
            amount,
            status: 'pending'
        });

        await withdrawalRequest.save();
        res.status(201).json({ message: 'Withdrawal request submitted successfully', withdrawalRequest });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.approveWithdrawal = async (req, res) => {
    const { id } = req.params;

    try {
        const withdrawal = await Withdrawal.findById(id);
        if (!withdrawal) {
            return res.status(404).json({ message: 'Withdrawal request not found' });
        }

        withdrawal.status = 'approved';
        await withdrawal.save();

        // Update the seller's balance
        const seller = await User.findById(withdrawal.sellerId);
        const restaurant = await Restaurant.findById(seller.managedRestaurant);
        restaurant.balance -= withdrawal.amount; // Deduct the amount from the restaurant's balance
        await restaurant.save();

        res.status(200).json({ message: 'Withdrawal approved successfully', withdrawal });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
