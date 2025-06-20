// controllers/withdrawalController.js
const Restaurant = require('../models/restaurantModel');
const { logActivity } = require('./activityController');

// طلب سحب جديد من البائع
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, paymentMethod, accountDetails } = req.body;
    const seller = req.user;

    if (!seller.managedRestaurant) {
      return res.status(400).json({ message: 'No restaurant assigned' });
    }

    const restaurant = await Restaurant.findById(seller.managedRestaurant);
    
    if (amount > restaurant.balance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    restaurant.withdrawalRequests.push({
      amount,
      paymentMethod,
      accountDetails,
      status: 'pending'
    });

    await restaurant.save();

    await logActivity('withdrawal_requested', seller._id, {
      amount,
      restaurantId: restaurant._id
    });

    res.status(200).json({
      message: 'Withdrawal request submitted',
      newBalance: restaurant.balance - amount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// الحصول على طلبات السحب للبائع
exports.getWithdrawalRequests = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(400).json({ message: 'No restaurant assigned' });
    }

    const restaurant = await Restaurant.findById(seller.managedRestaurant)
      .select('withdrawalRequests balance');

    res.status(200).json({
      balance: restaurant.balance,
      requests: restaurant.withdrawalRequests
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// (للأدمن) الحصول على جميع طلبات السحب
exports.getAllWithdrawalRequests = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      'withdrawalRequests.status': 'pending'
    })
    .populate('withdrawalRequests')
    .select('name withdrawalRequests');

    const pendingRequests = restaurants.reduce((acc, restaurant) => {
      const requests = restaurant.withdrawalRequests
        .filter(req => req.status === 'pending')
        .map(req => ({
          ...req.toObject(),
          restaurantName: restaurant.name
        }));
      return [...acc, ...requests];
    }, []);

    res.status(200).json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// (للأدمن) الموافقة على طلب السحب
exports.approveWithdrawal = async (req, res) => {
  try {
    const { requestId, restaurantId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);
    
    const request = restaurant.withdrawalRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.amount > restaurant.balance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    request.status = 'approved';
    request.processedAt = new Date();
    restaurant.balance -= request.amount;
    restaurant.totalWithdrawn += request.amount;

    await restaurant.save();

    await logActivity('withdrawal_approved', req.user._id, {
      amount: request.amount,
      restaurantId: restaurant._id,
      requestId: request._id
    });

    res.status(200).json({ message: 'Withdrawal approved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// (للأدمن) رفض طلب السحب
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { requestId, restaurantId } = req.params;
    const { reason } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    
    const request = restaurant.withdrawalRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'rejected';
    request.processedAt = new Date();
    request.rejectionReason = reason;

    await restaurant.save();

    await logActivity('withdrawal_rejected', req.user._id, {
      amount: request.amount,
      restaurantId: restaurant._id,
      requestId: request._id,
      reason
    });

    res.status(200).json({ message: 'Withdrawal rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};