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
      const lastMonthDate = new Date(currentDate);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
  

      const getEarnings = (month) => {
        const entry = restaurant.earnings.find(e => e.month === month);
        return entry ? entry.amount : 0;
      };
  
      const currentEarnings = getEarnings(currentMonth);
      const lastEarnings = getEarnings(lastMonth);
  

      let percentageIncrease;
      if (lastEarnings > 0) {
        const increase = ((currentEarnings - lastEarnings) / lastEarnings) * 100;
        percentageIncrease = `${increase.toFixed(2)}%`;
      } else {
        percentageIncrease = currentEarnings > 0 ? "100%" : "0%";
      }
  

      res.status(200).json({
        totalEarnings: currentEarnings,
        currency: "EGP",
        percentageIncrease
      });
  
    } catch (error) {
      console.error("Error in getMonthlyEarnings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };





  const Restaurant = require('../models/restaurantModel');

exports.getThisMonthEarnings = async (req, res) => {
  try {

    const restaurant = await Restaurant.findById(req.user.managedRestaurant);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }


    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const prevMonthDate = new Date(now);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;


    const getEarnings = (month) => {
      const entry = restaurant.monthlyEarnings.find(e => e.month === month);
      return entry ? entry.amount : 0;
    };

    const currentEarnings = getEarnings(currentMonth);
    const prevEarnings = getEarnings(prevMonth);


    let percentageChange = "0%";
    if (prevEarnings !== 0) {
      const change = ((currentEarnings - prevEarnings) / prevEarnings) * 100;
      percentageChange = `${change.toFixed(2)}%`;
    } else if (currentEarnings !== 0) {
      percentageChange = "100%";
    }


    res.status(200).json({
      thisMonthEarnings: currentEarnings,
      currency: "EGP",
      percentageChange
    });

  } catch (error) {
    console.error("Error in getThisMonthEarnings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};