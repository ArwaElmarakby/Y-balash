const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');


exports.getSellerOrders = async (req, res) => {
    try {
        const seller = req.seller;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to this seller' });
        }

        const orders = await Order.find({ restaurantId: seller.managedRestaurant })
            .populate('userId', 'email phone')
            .populate('items.itemId', 'name price');

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


exports.updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        const order = await Order.findOneAndUpdate(
            { 
                _id: orderId,
                restaurantId: req.seller.managedRestaurant 
            },
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found or not under your management' });
        }

        res.status(200).json({ message: 'Order status updated', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};



exports.getAvailableForWithdrawal = async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.user.managedRestaurant);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
  

      const availableForWithdrawal = restaurant.balance;
  
      res.status(200).json(availableForWithdrawal); 
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };




  exports.getMonthlyEarnings = async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.user.managedRestaurant);
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
  

      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const lastMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth()).padStart(2, '0')}`;
  

      const currentEarnings = restaurant.earnings.find(e => e.month === currentMonth)?.amount || 0;
      const lastEarnings = restaurant.earnings.find(e => e.month === lastMonth)?.amount || 0;
  

      let percentageIncrease = "0%"; 
      if (lastEarnings > 0) {
        const increase = ((currentEarnings - lastEarnings) / lastEarnings) * 100;
        percentageIncrease = `${increase.toFixed(2)}%`; 
      } else if (currentEarnings > 0) {
        percentageIncrease = "100%"; 
      }
  

      res.status(200).json({
        totalEarnings: currentEarnings,
        currency: "EGP",
        percentageIncrease 
      });
  
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };