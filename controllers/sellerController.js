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




  exports.getOrderStats = async (req, res) => {
    if (!req.user?.managedRestaurant) {
      return res.status(403).json({
        total_orders: 0,
        percentage_change: "0%"
      });
    }
  
    try {
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
  
      const currentOrders = await Order.countDocuments({
        restaurantId: req.user.managedRestaurant,
        createdAt: {
          $gte: new Date(`${currentMonthKey}-01`),
          $lt: new Date(`${currentMonthKey}-31`)
        }
      });
  
      const previousOrders = await Order.countDocuments({
        restaurantId: req.user.managedRestaurant,
        createdAt: {
          $gte: new Date(`${prevMonthKey}-01`),
          $lt: new Date(`${prevMonthKey}-31`)
        }
      });
  
      let percentageChange = "0%";
      if (previousOrders > 0) {
        const change = ((currentOrders - previousOrders) / previousOrders) * 100;
        percentageChange = change >= 0 
          ? `+${Math.abs(change).toFixed(2)}%` 
          : `-${Math.abs(change).toFixed(2)}%`;
      } else if (currentOrders > 0) {
        percentageChange = "+100%";
      }
  
      return res.status(200).json({
        total_orders: currentOrders,
        percentage_change: percentageChange
      });
  
    } catch (error) {
      return res.status(200).json({
        total_orders: 0,
        percentage_change: "0%"
      });
    }
  };




  exports.getAverageOrderValue = async (req, res) => {
    if (!req.user?.managedRestaurant) {
      return res.status(200).json({
        average_order_value: 0,
        percentage_change: "0%"
      });
    }
  
    try {
      // Calculate current and previous month dates
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      let prevYear = currentYear;
      let prevMonth = currentMonth - 1;
      
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear--;
      }
  
      // Date range for current month
      const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const currentMonthEnd = new Date(currentYear, currentMonth, 0);
      
      // Date range for previous month
      const prevMonthStart = new Date(prevYear, prevMonth - 1, 1);
      const prevMonthEnd = new Date(prevYear, prevMonth, 0);
  
      // Get current month orders
      const currentMonthOrders = await Order.find({
        restaurantId: req.user.managedRestaurant,
        createdAt: { $gte: currentMonthStart, $lte: currentMonthEnd }
      });
  
      // Get previous month orders
      const prevMonthOrders = await Order.find({
        restaurantId: req.user.managedRestaurant,
        createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd }
      });
  
      // Calculate averages
      const currentAvg = currentMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0) / 
                        (currentMonthOrders.length || 1);
      
      const prevAvg = prevMonthOrders.reduce((sum, order) => sum + order.totalAmount, 0) / 
                     (prevMonthOrders.length || 1);
  
      // Calculate percentage change
      let percentageChange = "0%";
      if (prevAvg > 0) {
        const change = ((currentAvg - prevAvg) / prevAvg) * 100;
        percentageChange = change >= 0 
          ? `+${Math.abs(change).toFixed(2)}%` 
          : `-${Math.abs(change).toFixed(2)}%`;
      } else if (currentAvg > 0) {
        percentageChange = "+100%";
      }
  
      return res.status(200).json({
        average_order_value: Math.round(currentAvg),
        percentage_change: percentageChange
      });
  
    } catch (error) {
      return res.status(200).json({
        average_order_value: 0,
        percentage_change: "0%"
      });
    }
  };




  exports.getRecentPayouts = async (req, res) => {
    try {
      if (!req?.user?.managedRestaurant) {
        return res.status(200).json([]);
      }
  
      const restaurant = await Restaurant.findOne(
        { _id: req.user.managedRestaurant },
        { payouts: 1 }
      )
      .sort({ 'payouts.date': -1 })
      .lean();
  
      if (!restaurant?.payouts?.length) {
        return res.status(200).json([]);
      }
  
      const safePayouts = restaurant.payouts.slice(0, 5).map(payout => ({
        date: payout.date instanceof Date ? payout.date.toISOString().split('T')[0] : 'N/A',
        amount: Number(payout.amount) || 0,
        payment_method: ['Bank Transfer', 'Vodafone Cash', 'PayPal', 'Other'].includes(payout.paymentMethod) 
          ? payout.paymentMethod 
          : 'Other',
        status: ['paid', 'pending'].includes(payout.status) ? payout.status : 'pending'
      }));
  
      return res.status(200).json(safePayouts);
  
    } catch (error) {
      console.error('Payouts Error:', error.message);
      return res.status(200).json([]);
    }
  };