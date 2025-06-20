// controllers/withdrawalController.js
const Restaurant = require('../models/restaurantModel');
const { logActivity } = require('./activityController');

// طلب سحب جديد
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, accountDetails } = req.body;
    const seller = req.user;

    const restaurant = await Restaurant.findById(seller.managedRestaurant);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (amount > restaurant.balance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // خصم المبلغ من الرصيد وإضافته لطلبات السحب
    restaurant.balance -= amount;
    restaurant.pendingWithdrawals += amount;
    
    restaurant.withdrawals.push({
      amount,
      paymentMethod,
      accountDetails,
      status: 'pending'
    });

    await restaurant.save();

    await logActivity('withdrawal_request', seller._id, {
      amount,
      restaurant: restaurant.name
    });

    res.status(200).json({
      message: 'Withdrawal request submitted successfully',
      newBalance: restaurant.balance
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// الحصول على طلبات السحب للمطعم
exports.getWithdrawals = async (req, res) => {
  try {
    const seller = req.user;
    const restaurant = await Restaurant.findById(seller.managedRestaurant)
      .select('withdrawals balance pendingWithdrawals');

    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// (للمسؤول) الموافقة على طلب السحب
exports.approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const restaurant = await Restaurant.findOne({
      'withdrawals._id': withdrawalId
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    const withdrawal = restaurant.withdrawals.id(withdrawalId);
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }

    // تحديث حالة السحب
    withdrawal.status = 'approved';
    withdrawal.processedDate = new Date();
    restaurant.pendingWithdrawals -= withdrawal.amount;
    
    await restaurant.save();

    await logActivity('withdrawal_approved', req.user._id, {
      amount: withdrawal.amount,
      restaurant: restaurant.name
    });

    res.status(200).json({ message: 'Withdrawal approved successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// (للمسؤول) رفض طلب السحب
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;

    const restaurant = await Restaurant.findOne({
      'withdrawals._id': withdrawalId
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    const withdrawal = restaurant.withdrawals.id(withdrawalId);
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }

    // إعادة المبلغ للرصيد وتحديث الحالة
    withdrawal.status = 'rejected';
    withdrawal.rejectionReason = reason;
    restaurant.balance += withdrawal.amount;
    restaurant.pendingWithdrawals -= withdrawal.amount;
    
    await restaurant.save();

    await logActivity('withdrawal_rejected', req.user._id, {
      amount: withdrawal.amount,
      restaurant: restaurant.name,
      reason
    });

    res.status(200).json({ message: 'Withdrawal rejected successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};