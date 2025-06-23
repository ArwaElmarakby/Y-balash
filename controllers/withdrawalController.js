// controllers/withdrawalController.js
const WithdrawalRequest = require('../models/withdrawalRequestModel');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');

// إنشاء طلب سحب جديد
exports.createWithdrawalRequest = async (req, res) => {
  try {
    const { amount } = req.body;
    const seller = req.user;

    if (!seller.managedRestaurant) {
      return res.status(400).json({ message: 'No restaurant assigned' });
    }

    const restaurant = await Restaurant.findById(seller.managedRestaurant);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (amount > restaurant.balance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const newRequest = new WithdrawalRequest({
      sellerId: seller._id,
      amount: amount
    });

    await newRequest.save();

    res.status(201).json({
      message: 'Withdrawal request submitted',
      request: newRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// الموافقة على طلب السحب (لـ Admin)
exports.approveWithdrawal = async (req, res) => {
  try {
    const { requestId, note } = req.body;

    const request = await WithdrawalRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const seller = await User.findById(request.sellerId);
    if (!seller || !seller.managedRestaurant) {
      return res.status(404).json({ message: 'Seller or restaurant not found' });
    }

    const restaurant = await Restaurant.findById(seller.managedRestaurant);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // خصم المبلغ من رصيد المطعم
    restaurant.balance -= request.amount;
    request.status = 'approved';
    request.adminNote = note;
    request.updatedAt = new Date();

    await Promise.all([
      restaurant.save(),
      request.save()
    ]);

    res.status(200).json({
      message: 'Withdrawal approved',
      request: request,
      restaurantBalance: restaurant.balance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// رفض طلب السحب (لـ Admin)
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { requestId, note } = req.body;

    const request = await WithdrawalRequest.findByIdAndUpdate(
      requestId,
      { 
        status: 'rejected',
        adminNote: note,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json({
      message: 'Withdrawal rejected',
      request: request
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// الحصول على طلبات السحب للبائع
exports.getSellerRequests = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find({ sellerId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// الحصول على جميع طلبات السحب (لـ Admin)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await WithdrawalRequest.find()
      .populate('sellerId', 'email')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};