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





  exports.getCurrentMonthEarnings = async (req, res) => {
    if (!req.user?.managedRestaurant) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }
  
    try {
      const restaurant = await Restaurant.findOne(
        { _id: req.user.managedRestaurant },
        { monthlyEarnings: 1 }
      ).lean().exec();
  
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found"
        });
      }
  
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      let prevYear = currentYear;
      let prevMonth = currentMonth - 1;
      
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear--;
      }
  
      const formatMonth = (y, m) => `${y}-${m.toString().padStart(2, '0')}`;
      
      const currentMonthKey = formatMonth(currentYear, currentMonth);
      const prevMonthKey = formatMonth(prevYear, prevMonth);
  
      const getEarnings = (month) => {
        if (!restaurant.monthlyEarnings) return 0;
        const entry = restaurant.monthlyEarnings.find(e => e.month === month);
        return entry ? entry.amount : 0;
      };
  
      const currentEarnings = Number(getEarnings(currentMonthKey)) || 0;
      const previousEarnings = Number(getEarnings(prevMonthKey)) || 0;
  
      let percentageChange = "0%";
      if (previousEarnings > 0) {
        const change = ((currentEarnings - previousEarnings) / previousEarnings) * 100;
        percentageChange = change >= 0 
          ? `+${Math.abs(change).toFixed(2)}%` 
          : `-${Math.abs(change).toFixed(2)}%`;
      } else if (currentEarnings > 0) {
        percentageChange = "+100%";
      }
  
      const response = {
        success: true,
        data: {
          current_month: currentMonthKey,
          current_earnings: currentEarnings,
          previous_month: prevMonthKey,
          previous_earnings: previousEarnings,
          percentage_change: percentageChange,
          currency: "EGP"
        }
      };
  
      return res.status(200).json(response);
  
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  };