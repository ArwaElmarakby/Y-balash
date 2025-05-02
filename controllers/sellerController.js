const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Image = require('../models/imageModel');



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
      const seller = req.user;
      
      if (!seller.managedRestaurant) {
        return res.status(400).json({ message: 'No restaurant assigned to you' });
      }
  
      const restaurant = await Restaurant.findById(seller.managedRestaurant)
        .select('payouts')
        .sort({ 'payouts.date': -1 }) 
        .limit(10); 
  
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
  
      res.status(200).json({
        message: 'Recent payouts retrieved successfully',
        payouts: restaurant.payouts
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Server error',
        error: error.message
      });
    }
  };
  
  exports.requestPayout = async (req, res) => {
    try {
      const seller = req.user;
      const { amount, paymentMethod } = req.body;
  
      if (!seller.managedRestaurant) {
        return res.status(400).json({ message: 'No restaurant assigned to you' });
      }
  
      if (!amount || !paymentMethod) {
        return res.status(400).json({ message: 'Amount and payment method are required' });
      }
  
      const restaurant = await Restaurant.findById(seller.managedRestaurant);
      
      if (restaurant.balance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
  

      restaurant.balance -= amount;
      restaurant.payouts.push({
        amount,
        paymentMethod,
        status: 'pending'
      });
      
      await restaurant.save();
  
      res.status(200).json({
        message: 'Payout requested successfully',
        newBalance: restaurant.balance
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Server error',
        error: error.message
      });
    }
  };





  exports.getMonthlyRefunds = async (req, res) => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
      const restaurant = await Restaurant.findOne(
        { _id: req.user.managedRestaurant },
        { refunds: 1 }
      );
  
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found"
        });
      }
  
      const monthlyRefunds = restaurant.refunds.filter(refund => 
        refund.date >= firstDay && refund.date <= lastDay
      );
  
      const totalAmount = monthlyRefunds.reduce((sum, refund) => sum + refund.amount, 0);
      const refundCount = monthlyRefunds.length;
  
      res.status(200).json({
        success: true,
        month: now.toLocaleString('en-US', { month: 'long' }),
        year: now.getFullYear(),
        totalAmount: totalAmount.toFixed(2),
        refundCount,
        currency: "EGP"
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  };




  exports.getBestSeller = async (req, res) => {
    try {
      const restaurantId = req.user.managedRestaurant;
  
      const bestSeller = await Order.aggregate([
        { 
          $match: { 
            restaurantId: restaurantId,
            status: { $ne: 'cancelled' } 
          } 
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.itemId',
            totalUnits: { $sum: '$items.quantity' }
          }
        },
        { $sort: { totalUnits: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: 'images',
            localField: '_id',
            foreignField: '_id',
            as: 'itemDetails'
          }
        },
        { $unwind: '$itemDetails' },
        {
          $project: {
            itemName: '$itemDetails.name',
            itemImage: '$itemDetails.imageUrl',
            totalUnits: 1,
            _id: 0
          }
        }
      ]);
  
      if (!bestSeller.length) {
        return res.status(200).json({
          success: true,
          message: "No sales data available",
          bestSeller: null
        });
      }
  
      res.status(200).json({
        success: true,
        bestSeller: bestSeller[0]
      });
  
    } catch (error) {
      console.error('Error fetching best seller:', error);
      res.status(500).json({
        success: false,
        message: "Error fetching best seller data"
      });
    }
  };




  exports.getCompletedOrdersThisMonth = async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to you' });
        }

        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const completedOrders = await Order.countDocuments({
            restaurantId: seller.managedRestaurant,
            status: 'delivered',
            createdAt: {
                $gte: firstDayOfMonth,
                $lte: lastDayOfMonth
            }
        });

        res.status(200).json({
            success: true,
            month: currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
            completedOrders,
            message: 'Completed orders count retrieved successfully'
        });
    } catch (error) {
        console.error("Error in getCompletedOrdersThisMonth:", error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};




exports.getSellerNotifications = async (req, res) => {
  try {
      const seller = req.user;
      
      if (!seller.managedRestaurant) {
          return res.status(400).json({ message: 'No restaurant assigned' });
      }


      const newOrders = await Order.find({
          restaurantId: seller.managedRestaurant,
          status: 'pending',
          'notifications.type': 'new_order',
          'notifications.isRead': false
      })
      .populate('userId', 'firstName lastName')
      .select('_id totalAmount items');


      const lowStockItems = await Image.find({
          restaurant: seller.managedRestaurant,
          quantity: { $lte: 10 } 
      })
      .select('name quantity');
      console.log("Low Stock Items:", lowStockItems);


      const restaurant = await Restaurant.findById(seller.managedRestaurant)
          .select('payouts');

      const unreadPayouts = restaurant.payouts.filter(p => !p.isRead);


      const notifications = {
          newOrders: newOrders.map(order => ({
              type: 'new_order',
              orderId: order._id,
              customerName: order.userId ? `${order.userId.firstName} ${order.userId.lastName}` : 'Guest',
              totalAmount: order.totalAmount,
              items: order.items
          })),
          lowStockAlerts: lowStockItems.map(item => ({
              type: 'low_stock',
              productName: item.name,
              remainingQuantity: item.quantity
          })),
          payouts: unreadPayouts.map(payout => ({
              type: 'payout',
              amount: payout.amount,
              status: payout.status,
              date: payout.date
          }))
      };

      res.status(200).json(notifications);
  } catch (error) {
    console.error("Full Error:", error);
    res.status(500).json({ 
        message: 'Server error',
        error: error.message 
    });
}
};


exports.getSellerProfile = async (req, res) => {
  try {
      const seller = await User.findById(req.user._id);
      
      if (!seller) {
          return res.status(404).json({ message: 'Seller not found' });
      }


      const usernameFromEmail = seller.email.split('@')[0];

      res.status(200).json({
          profileImage: seller.profileImage || null, 
          username: usernameFromEmail, 
          fullEmail: seller.email, 
          language: seller.language || null 
      });
  } catch (error) {
      res.status(500).json({ 
          message: 'Server error',
          error: error.message 
      });
  }
};


exports.updateLanguage = async (req, res) => {
  try {
      const { language } = req.body;

      const updatedSeller = await User.findByIdAndUpdate(
          req.user._id,
          { language },
          { new: true }
      ).select('language');

      res.status(200).json({
          message: 'Language updated successfully',
          language: updatedSeller.language
      });
  } catch (error) {
      res.status(500).json({ 
          message: 'Server error',
          error: error.message 
      });
  }
};



exports.getMyRestaurant = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(400).json({ 
        success: false,
        message: 'No restaurant assigned to this seller' 
      });
    }

    const restaurant = await Restaurant.findById(seller.managedRestaurant)
      .select('name location description defaultShippingTime imageUrl');

    if (!restaurant) {
      return res.status(404).json({ 
        success: false,
        message: 'Restaurant not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: restaurant.name,
        location: restaurant.location,
        description: restaurant.description,
        defaultShippingTime: restaurant.defaultShippingTime || '30-45 minutes'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error'
    });
  }
};




exports.getPaymentSettings = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id)
      .select('paymentSettings');

    res.status(200).json({
      success: true,
      paymentSettings: seller.paymentSettings || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get payment settings'
    });
  }
};





exports.updatePaymentSettings = async (req, res) => {
  try {
    const { accountNumber, accountHolderName, bankName } = req.body;

    const updatedSeller = await User.findByIdAndUpdate(
      req.user._id,
      {
        paymentSettings: {
          accountNumber,
          accountHolderName,
          bankName
        }
      },
      { new: true }
    ).select('paymentSettings');

    res.status(200).json({
      success: true,
      message: 'Payment settings updated',
      paymentSettings: updatedSeller.paymentSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update payment settings'
    });
  }
};