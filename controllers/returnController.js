const Return = require('../models/returnModel');
const Restaurant = require('../models/restaurantModel');
const { logActivity } = require('./activityController');

exports.addReturn = async (req, res) => {
  try {
    const { productName, quantity, price, reason } = req.body;
    const seller = req.user;

    if (!seller.managedRestaurant) {
      return res.status(400).json({ 
        success: false,
        message: 'No restaurant assigned to this seller' 
      });
    }

    if (!productName || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Product name, quantity and price are required'
      });
    }

    const newReturn = new Return({
      productName,
      quantity,
      price,
      reason: reason || 'No reason provided',
      sellerId: seller._id,
      restaurantId: seller.managedRestaurant
    });

    await newReturn.save();

    // Log activity
    await logActivity('return_added', seller._id, {
      productName,
      quantity,
      totalAmount: quantity * price
    });

    res.status(201).json({
      success: true,
      message: 'Return added successfully',
      return: newReturn
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add return',
      error: error.message
    });
  }
};

exports.getReturnsSummary = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(400).json({ 
        success: false,
        message: 'No restaurant assigned to this seller' 
      });
    }

    const returns = await Return.find({ restaurantId: seller.managedRestaurant });

    const summary = returns.reduce((acc, ret) => {
      return {
        totalReturns: acc.totalReturns + 1,
        totalQuantity: acc.totalQuantity + ret.quantity,
        totalAmount: acc.totalAmount + (ret.quantity * ret.price)
      };
    }, { totalReturns: 0, totalQuantity: 0, totalAmount: 0 });

    res.status(200).json({
      success: true,
      summary
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get returns summary',
      error: error.message
    });
  }
};