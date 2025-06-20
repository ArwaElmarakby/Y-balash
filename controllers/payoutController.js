// controllers/payoutController.js
const Restaurant = require('../models/restaurantModel');
const { processPayout } = require('../services/paymentService');

exports.requestCardPayout = async (req, res) => {
  const { amount, cardToken } = req.body;
  const seller = req.user;

  try {
    // 1. التحقق من وجود مطعم
    const restaurant = await Restaurant.findById(seller.managedRestaurant);
    if (!restaurant) {
      return res.status(400).json({ 
        success: false,
        message: 'No restaurant assigned' 
      });
    }

    // 2. التحقق من الرصيد المتاح
    if (amount > restaurant.availableBalance) {
      return res.status(400).json({ 
        success: false,
        message: 'Insufficient balance' 
      });
    }

    // 3. معالجة السحب عبر Stripe
    const payoutResult = await processPayout(seller, amount, cardToken);

    if (!payoutResult.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Payout failed',
        error: payoutResult.error 
      });
    }

    // 4. تحديث سجلات المطعم
    restaurant.payouts.push({
      amount,
      paymentMethod: 'card',
      cardDetails: {
        last4: cardToken.card.last4,
        brand: cardToken.card.brand
      },
      status: payoutResult.status,
      transactionId: payoutResult.payoutId
    });

    restaurant.availableBalance -= amount;
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Payout processed successfully',
      payout: {
        id: payoutResult.payoutId,
        amount,
        status: payoutResult.status,
        newBalance: restaurant.availableBalance
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};