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




//   exports.getMonthlyEarnings = async (req, res) => {
//   try {
//     const seller = req.user;
    
//     if (!seller.managedRestaurant) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'No restaurant assigned to this seller' 
//       });
//     }

//     // حساب الإيرادات الشهرية
//     const monthlyEarnings = await Order.aggregate([
//       {
//         $match: {
//           restaurantId: seller.managedRestaurant,
//           status: 'delivered' // فقط الطلبات المكتملة
//         }
//       },
//       {
//         $group: {
//           _id: {
//             year: { $year: "$createdAt" },
//             month: { $month: "$createdAt" }
//           },
//           totalEarnings: { $sum: "$totalAmount" },
//           orderCount: { $sum: 1 }
//         }
//       },
//       {
//         $sort: { "_id.year": 1, "_id.month": 1 }
//       }
//     ]);

//     res.status(200).json({
//       success: true,
//       data: monthlyEarnings.map(item => ({
//         year: item._id.year,
//         month: item._id.month,
//         totalEarnings: item.totalEarnings,
//         orderCount: item.orderCount,
//         currency: "EGP"
//       }))
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch monthly earnings',
//       error: error.message
//     });
//   }
// };





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





  // exports.getMonthlyRefunds = async (req, res) => {
  //   try {
  //     const now = new Date();
  //     const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  //     const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  //     const restaurant = await Restaurant.findOne(
  //       { _id: req.user.managedRestaurant },
  //       { refunds: 1 }
  //     );
  
  //     if (!restaurant) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Restaurant not found"
  //       });
  //     }
  
  //     const monthlyRefunds = restaurant.refunds.filter(refund => 
  //       refund.date >= firstDay && refund.date <= lastDay
  //     );
  
  //     const totalAmount = monthlyRefunds.reduce((sum, refund) => sum + refund.amount, 0);
  //     const refundCount = monthlyRefunds.length;
  
  //     res.status(200).json({
  //       success: true,
  //       month: now.toLocaleString('en-US', { month: 'long' }),
  //       year: now.getFullYear(),
  //       totalAmount: totalAmount.toFixed(2),
  //       refundCount,
  //       currency: "EGP"
  //     });
  
  //   } catch (error) {
  //     res.status(500).json({
  //       success: false,
  //       message: "Server error"
  //     });
  //   }
  // };




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




// exports.getLowStockItems = async (req, res) => {
//   try {
//     const seller = req.user;
    
//     if (!seller.managedRestaurant) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'No restaurant assigned to this seller' 
//       });
//     }

//     const LOW_STOCK_THRESHOLD = 4;
//     const CRITICAL_STOCK_THRESHOLD = 2; 

//     const lowStockItems = await Image.find({
//       restaurant: seller.managedRestaurant,
//       quantity: { $lte: LOW_STOCK_THRESHOLD }
//     }).select('name quantity price imageUrl');

//     const formattedItems = lowStockItems.map(item => ({
//       id: item._id,
//       name: item.name,
//       remaining: item.quantity,
//       imageUrl: item.imageUrl,
//       status: item.quantity <= CRITICAL_STOCK_THRESHOLD ? 'CRITICAL' : 'LOW',
//       price: item.price
//     }));

//     res.status(200).json({
//       success: true,
//       count: lowStockItems.length,
//       items: formattedItems
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error'
//     });
//   }
// };



exports.getStockStats = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(400).json({ 
        outOfStock: 0,
        lowStock: 0
      });
    }

    const LOW_STOCK_THRESHOLD = 10;
    
    const [outOfStockCount, lowStockCount] = await Promise.all([
      Image.countDocuments({
        restaurant: seller.managedRestaurant,
        quantity: { $lte: 0 }
      }),
      Image.countDocuments({
        restaurant: seller.managedRestaurant,
        quantity: { $gt: 0, $lte: LOW_STOCK_THRESHOLD }
      })
    ]);

    res.status(200).json({
      outOfStock: outOfStockCount,
      lowStock: lowStockCount
    });
  } catch (error) {
    res.status(500).json({ 
      outOfStock: 0,
      lowStock: 0
    });
  }
};




exports.getInventoryItems = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(400).json({ 
        success: false,
        message: 'No restaurant assigned to this seller' 
      });
    }

    const LOW_STOCK_THRESHOLD = 10;
    const items = await Image.find({
      restaurant: seller.managedRestaurant
    }).select('name quantity price imageUrl updatedAt');

    const inventory = items.map(item => {
      let status = 'IN_STOCK';
      let statusQuantity = item.quantity;
      
      if (item.quantity <= 0) {
        status = 'OUT_OF_STOCK';
        statusQuantity = 0;
      } else if (item.quantity <= LOW_STOCK_THRESHOLD) {
        status = 'LOW_STOCK';
      }

      return {
        id: item._id,
        name: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        status,
        statusQuantity,
        lastUpdated: item.updatedAt
      };
    });


    const stats = {
      inStock: inventory.filter(i => i.status === 'IN_STOCK').length,
      lowStock: inventory.filter(i => i.status === 'LOW_STOCK').length,
      outOfStock: inventory.filter(i => i.status === 'OUT_OF_STOCK').length
    };

    res.status(200).json({
      success: true,
      stats,
      items: inventory
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error'
    });
  }
};




exports.getRestaurantProducts = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(400).json({ 
        success: false,
        message: 'No restaurant assigned to this seller' 
      });
    }

    const products = await Image.find({
      restaurant: seller.managedRestaurant
    }).select('name price imageUrl quantity category updatedAt');

    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.quantity > 0 ? product.quantity : 0,
      status: product.quantity <= 0 ? 'Out of Stock' : 
              product.quantity <= 10 ? 'Low Stock' : 'In Stock',
      category: product.category,
      lastUpdated: product.updatedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch products'
    });
  }
};


exports.getRevenueStats = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(200).json({
        totalRevenue: 0,
        percentageChange: "0%"
      });
    }

    const now = new Date();
    const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const [currentWeekRevenue, lastWeekRevenue] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            restaurantId: seller.managedRestaurant,
            createdAt: { $gte: currentWeekStart },
            status: { $ne: 'cancelled' }
          }
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      Order.aggregate([
        {
          $match: {
            restaurantId: seller.managedRestaurant,
            createdAt: { $gte: lastWeekStart, $lt: currentWeekStart },
            status: { $ne: 'cancelled' }
          }
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ])
    ]);

    const current = currentWeekRevenue[0]?.total || 0;
    const last = lastWeekRevenue[0]?.total || 0;

    let percentageChange = "0%";
    if (last > 0) {
      const change = ((current - last) / last) * 100;
      percentageChange = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
    } else if (current > 0) {
      percentageChange = "+100%";
    }

    res.status(200).json({
      totalRevenue: current,
      percentageChange
    });

  } catch (error) {
    res.status(200).json({
      totalRevenue: 0,
      percentageChange: "0%"
    });
  }
};




exports.getNewCustomersStats = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(200).json({
        newCustomers: 0,
        percentageChange: "0%"
      });
    }

    const now = new Date();
    const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const [currentWeekCustomers, lastWeekCustomers] = await Promise.all([
      Order.distinct('userId', {
        restaurantId: seller.managedRestaurant,
        createdAt: { $gte: currentWeekStart },
        status: { $ne: 'cancelled' }
      }),
      Order.distinct('userId', {
        restaurantId: seller.managedRestaurant,
        createdAt: { $gte: lastWeekStart, $lt: currentWeekStart },
        status: { $ne: 'cancelled' }
      })
    ]);

    const currentCount = currentWeekCustomers.length;
    const lastCount = lastWeekCustomers.length;

    let percentageChange = "0%";
    if (lastCount > 0) {
      const change = ((currentCount - lastCount) / lastCount) * 100;
      percentageChange = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
    } else if (currentCount > 0) {
      percentageChange = "+100%";
    }

    res.status(200).json({
      newCustomers: currentCount,
      percentageChange
    });

  } catch (error) {
    res.status(200).json({
      newCustomers: 0,
      percentageChange: "0%"
    });
  }
};




exports.getTopProduct = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(200).json({
        productName: "N/A",
        soldCount: 0,
        percentageChange: "0%"
      });
    }

    const now = new Date();
    const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);


    const currentWeekTopProduct = await Order.aggregate([
      {
        $match: {
          restaurantId: seller.managedRestaurant,
          createdAt: { $gte: currentWeekStart },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.itemId",
          count: { $sum: "$items.quantity" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "images",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" }
    ]);


    let lastWeekCount = 0;
    if (currentWeekTopProduct.length > 0) {
      const lastWeekSales = await Order.aggregate([
        {
          $match: {
            restaurantId: seller.managedRestaurant,
            createdAt: { $gte: lastWeekStart, $lt: currentWeekStart },
            status: { $ne: 'cancelled' },
            "items.itemId": currentWeekTopProduct[0]._id
          }
        },
        { $unwind: "$items" },
        {
          $match: {
            "items.itemId": currentWeekTopProduct[0]._id
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: "$items.quantity" }
          }
        }
      ]);

      lastWeekCount = lastWeekSales[0]?.count || 0;
    }

    const currentCount = currentWeekTopProduct[0]?.count || 0;
    const productName = currentWeekTopProduct[0]?.product?.name || "N/A";

    let percentageChange = "0%";
    if (lastWeekCount > 0) {
      const change = ((currentCount - lastWeekCount) / lastWeekCount) * 100;
      percentageChange = change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
    } else if (currentCount > 0) {
      percentageChange = "+100%";
    }

    res.status(200).json({
      productName,
      soldCount: currentCount,
      percentageChange
    });

  } catch (error) {
    res.status(200).json({
      productName: "N/A",
      soldCount: 0,
      percentageChange: "0%"
    });
  }
};



// exports.getTopSellingProducts = async (req, res) => {
//   try {
//     const seller = req.user;
    
//     if (!seller.managedRestaurant) {
//       return res.status(200).json([]);
//     }

//     const topProducts = await Order.aggregate([
//       {
//         $match: {
//           restaurantId: seller.managedRestaurant,
//           status: { $ne: 'cancelled' }
//         }
//       },
//       { $unwind: "$items" },
//       {
//         $group: {
//           _id: "$items.itemId",
//           unitsSold: { $sum: "$items.quantity" },
//           totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
//         }
//       },
//       { $sort: { totalRevenue: -1 } },
//       { $limit: 5 },
//       {
//         $lookup: {
//           from: "images",
//           localField: "_id",
//           foreignField: "_id",
//           as: "product"
//         }
//       },
//       { $unwind: "$product" },
//       {
//         $project: {
//           _id: 0,
//           productName: "$product.name",
//           imageUrl: "$product.imageUrl",
//           price: "$product.price",
//           unitsSold: 1,
//           totalRevenue: 1
//         }
//       }
//     ]);

//     res.status(200).json(topProducts);

//   } catch (error) {
//     res.status(200).json([]);
//   }
// };




exports.getBalance = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(200).json({
        availableBalance: 0,
        pendingBalance: 0
      });
    }

    const restaurant = await Restaurant.findById(seller.managedRestaurant)
      .select('balance pendingWithdrawals');

    res.status(200).json({
      availableBalance: restaurant.balance || 0,
      pendingBalance: restaurant.pendingWithdrawals || 0
    });

  } catch (error) {
    res.status(200).json({
      availableBalance: 0,
      pendingBalance: 0
    });
  }
};


exports.getSimplifiedMonthlyEarnings = async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                success: false,
                message: 'No restaurant assigned to this seller' 
            });
        }

        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Get current month earnings (from orders)
        const currentMonthStats = await Order.aggregate([
            {
                $match: {
                    restaurantId: seller.managedRestaurant,
                    createdAt: { $gte: currentMonthStart },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$totalAmount" }
                }
            }
        ]);

        const currentTotalEarnings = currentMonthStats[0]?.totalEarnings || 0;

        // Get total payouts that were paid this month
        const restaurant = await Restaurant.findById(seller.managedRestaurant);
        const currentMonthPaidPayouts = restaurant.payouts.filter(payout => {
            return payout.status === 'paid' && payout.date >= currentMonthStart;
        });

        const totalPaidPayouts = currentMonthPaidPayouts.reduce((acc, payout) => acc + payout.amount, 0);

        const netEarnings = currentTotalEarnings - totalPaidPayouts;

        res.status(200).json({
            success: true,
            totalEarnings: currentTotalEarnings,  // الاجمالي قبل خصم السحوبات
            totalWithdrawn: totalPaidPayouts,     // السحوبات المدفوعة خلال الشهر
            netEarnings: netEarnings < 0 ? 0 : netEarnings  // الصافي بعد الخصم
        });

    } catch (error) {
        console.error("Error in getSimplifiedMonthlyEarnings:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch monthly earnings',
            error: error.message
        });
    }
};


exports.requestWithdrawal = async (req, res) => {
    try {
        const seller = req.user;
        const { amount } = req.body;

        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to this seller' });
        }

        const restaurant = await Restaurant.findById(seller.managedRestaurant);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        if (amount <= 0) {
            return res.status(400).json({ message: 'Withdrawal amount must be greater than zero' });
        }

        restaurant.payouts.push({
            amount: amount,
            paymentMethod: 'pending',
            status: 'pending'
        });

        await restaurant.save();

        res.status(200).json({ message: 'Withdrawal request submitted successfully' , restaurantId: restaurant._id , payoutId: restaurant.payouts[restaurant.payouts.length - 1]._id });

    } catch (error) {
        console.error("Error in requestWithdrawal:", error);
        res.status(500).json({ message: 'Withdrawal request failed', error: error.message });
    }
};

exports.confirmWithdrawal = async (req, res) => {
    try {
        const { restaurantId, payoutId } = req.body;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const payout = restaurant.payouts.id(payoutId);
        if (!payout) {
            return res.status(404).json({ message: 'Payout not found' });
        }

        if (payout.status !== 'pending') {
            return res.status(400).json({ message: 'Payout already processed' });
        }

        // نحسب أرباحه الحالية من ال Orders
        const totalEarningsAggregation = await Order.aggregate([
            {
                $match: {
                    restaurantId: restaurant._id,
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$totalAmount" }
                }
            }
        ]);

        const totalEarnings = totalEarningsAggregation[0]?.totalEarnings || 0;

        // نجمع إجمالي اللي تم سحبه فعلاً سابقاً
        const totalPaidPayouts = restaurant.payouts
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0);

        const availableToWithdraw = totalEarnings - totalPaidPayouts;

        if (payout.amount > availableToWithdraw) {
            return res.status(400).json({ message: 'Not enough earnings to approve this payout' });
        }

        // خلاص موافقة: نخصم من balance
        restaurant.balance -= payout.amount;
        payout.status = 'paid';
        payout.paymentMethod = 'bank transfer';

        await restaurant.save();

        res.status(200).json({ message: 'Withdrawal confirmed and processed successfully' });

    } catch (error) {
        console.error("Error in confirmWithdrawal:", error);
        res.status(500).json({ message: 'Withdrawal confirmation failed', error: error.message });
    }
};

// exports.requestWithdrawal = async (req, res) => {
//   try {
//     const { amount, method, accountDetails } = req.body;
//     const seller = req.user;

//     if (!seller.managedRestaurant) {
//       return res.status(400).json({ success: false, message: 'No restaurant assigned' });
//     }

//     const restaurant = await Restaurant.findById(seller.managedRestaurant);

//     if (amount > restaurant.balance) {
//       return res.status(400).json({ success: false, message: 'Insufficient balance' });
//     }


//     restaurant.balance -= amount;
//     restaurant.pendingWithdrawals += amount;
//     await restaurant.save();


//     const transaction = {
//       amount,
//       method,
//       status: 'pending',
//       reference: `WDR-${Date.now()}`
//     };

//     await User.findByIdAndUpdate(seller._id, {
//       $push: { transactions: transaction }
//     });

//     res.status(200).json({ 
//       success: true,
//       message: 'Withdrawal request submitted',
//       newBalance: restaurant.balance
//     });

//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: 'Withdrawal request failed'
//     });
//   }
// };



exports.getTransactionHistory = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id)
      .select('transactions')
      .sort({ 'transactions.date': -1 });

    const formattedTransactions = seller.transactions.map(t => ({
      date: t.date,
      amount: t.amount,
      method: t.method === 'bank' ? 'Bank Transfer' : 
             t.method === 'mobile' ? 'Mobile Wallet' : 'PayPal',
      status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
      reference: t.reference
    }));

    res.status(200).json(formattedTransactions);

  } catch (error) {
    res.status(200).json([]);
  }
};





exports.getSalesAnalytics = async (req, res) => {
  try {
    const seller = req.user;
    const { period } = req.query; 

    if (!seller.managedRestaurant) {
      return res.status(200).json({
        success: false,
        message: 'No restaurant assigned'
      });
    }

    const now = new Date();
    let startDate, groupFormat;

    if (period === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
      groupFormat = { 
        day: { $dayOfMonth: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    } else { // month
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      groupFormat = { 
        week: { $week: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          restaurantId: seller.managedRestaurant,
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);


    const currentPeriodSales = salesData.reduce((sum, item) => sum + item.totalSales, 0);
    const previousPeriodSales = await getPreviousPeriodSales(seller.managedRestaurant, startDate, period);

    let percentageChange = 0;
    if (previousPeriodSales > 0) {
      percentageChange = ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100;
    } else if (currentPeriodSales > 0) {
      percentageChange = 100;
    }

    res.status(200).json({
      success: true,
      period,
      percentageChange: percentageChange.toFixed(2) + '%',
      chartData: formatChartData(salesData, period),
      totalSales: currentPeriodSales,
      totalOrders: salesData.reduce((sum, item) => sum + item.orderCount, 0)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

async function getPreviousPeriodSales(restaurantId, startDate, period) {
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - (period === 'week' ? 7 : 30));

  const result = await Order.aggregate([
    {
      $match: {
        restaurantId,
        createdAt: { $lt: startDate, $gte: prevStartDate },
        status: { $ne: 'cancelled' }
      }
    },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  return result[0]?.total || 0;
}

function formatChartData(data, period) {
  return data.map(item => ({
    label: period === 'week' 
      ? `Day ${item._id.day}/${item._id.month}` 
      : `Week ${item._id.week}`,
    sales: item.totalSales,
    orders: item.orderCount
  }));
}




exports.getRevenueTrends = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(200).json({
        success: false,
        message: 'No restaurant assigned'
      });
    }


    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);


    const revenueData = await Order.aggregate([
      {
        $match: {
          restaurantId: seller.managedRestaurant,
          createdAt: { $gte: sixMonthsAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          customerCount: { $addToSet: "$userId" }
        }
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          totalRevenue: 1,
          averageOrderValue: { $divide: ["$totalRevenue", "$orderCount"] },
          uniqueCustomers: { $size: "$customerCount" }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);


    const lifetimeValue = revenueData.reduce((sum, month) => sum + month.totalRevenue, 0);
    const customerAcquisitionCost = await calculateCustomerCost(seller.managedRestaurant, sixMonthsAgo);


    const formattedData = revenueData.map(item => ({
      month: `${item.month}/${item.year}`,
      revenue: item.totalRevenue,
      customers: item.uniqueCustomers,
      aov: item.averageOrderValue
    }));

    res.status(200).json({
      success: true,
      lifetimeValue,
      customerAcquisitionCost,
      monthlyTrends: formattedData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue trends'
    });
  }
};

async function calculateCustomerCost(restaurantId, startDate) {

  const marketingCosts = await Order.aggregate([
    {
      $match: {
        restaurantId,
        createdAt: { $gte: startDate },
        status: { $ne: 'cancelled' },
        discountAmount: { $gt: 0 }
      }
    },
    { $group: { _id: null, total: { $sum: "$discountAmount" } } }
  ]);


  const newCustomers = await Order.distinct('userId', {
    restaurantId,
    createdAt: { $gte: startDate },
    isFirstOrder: true
  });

  const totalCost = marketingCosts[0]?.total || 0;
  const customerCount = newCustomers.length || 1; 

  return totalCost / customerCount;
}




exports.getRevenuePeakTrends = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(200).json({
        success: false,
        message: 'No restaurant assigned'
      });
    }

    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueData = await Order.aggregate([
      {
        $match: {
          restaurantId: seller.managedRestaurant,
          createdAt: { $gte: sixMonthsAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    if (revenueData.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No revenue data available',
        monthlyTrends: [],
        peakMonth: null
      });
    }


    const peakMonth = revenueData.reduce((max, current) => 
      current.totalRevenue > max.totalRevenue ? current : max
    );


    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const formattedData = revenueData.map(item => ({
      label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: item.totalRevenue,
      isPeak: item._id.month === peakMonth._id.month && 
              item._id.year === peakMonth._id.year
    }));

    res.status(200).json({
      success: true,
      monthlyTrends: formattedData,
      peakMonth: {
        label: `${monthNames[peakMonth._id.month - 1]} ${peakMonth._id.year}`,
        revenue: peakMonth.totalRevenue
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue trends'
    });
  }
};




exports.getCustomerAnalytics = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(200).json({
        success: false,
        message: 'No restaurant assigned'
      });
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(currentMonthStart);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);


    const customerData = await Order.aggregate([
      {
        $match: {
          restaurantId: seller.managedRestaurant,
          createdAt: { $gte: threeMonthsAgo }
        }
      },
      {
        $group: {
          _id: "$userId",
          firstOrderDate: { $min: "$createdAt" },
          lastOrderDate: { $max: "$createdAt" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $project: {
          isNew: { $gte: ["$firstOrderDate", currentMonthStart] },
          isReturning: {
            $and: [
              { $lt: ["$firstOrderDate", currentMonthStart] },
              { $gte: ["$lastOrderDate", currentMonthStart] }
            ]
          },
          isChurned: {
            $and: [
              { $lt: ["$firstOrderDate", currentMonthStart] },
              { $lt: ["$lastOrderDate", currentMonthStart] },
              { $gte: ["$lastOrderDate", threeMonthsAgo] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          newCustomers: { $sum: { $cond: ["$isNew", 1, 0] } },
          returningCustomers: { $sum: { $cond: ["$isReturning", 1, 0] } },
          churnedCustomers: { $sum: { $cond: ["$isChurned", 1, 0] } }
        }
      }
    ]);

    const result = customerData[0] || {
      newCustomers: 0,
      returningCustomers: 0,
      churnedCustomers: 0
    };

    const totalActiveCustomers = result.newCustomers + result.returningCustomers;

    res.status(200).json({
      success: true,
      chartData: {
        labels: ["New", "Returning", "Churned"],
        datasets: [
          {
            data: [
              result.newCustomers,
              result.returningCustomers,
              result.churnedCustomers
            ],
            backgroundColor: [
              "#FFCE56", 
              "#36A2EB", 
              "#4BC0C0"  
            ]
          }
        ]
      },
      summary: {
        newCustomers: result.newCustomers,
        returningCustomers: result.returningCustomers,
        churnedCustomers: result.churnedCustomers,
        totalActiveCustomers,
        churnRate: totalActiveCustomers > 0 
          ? (result.churnedCustomers / totalActiveCustomers * 100).toFixed(2) + "%"
          : "0%"
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer analytics'
    });
  }
};


// exports.confirmCashPayment = async (req, res) => {
//     const { orderId } = req.params;
//     const seller = req.user;
//     try {
//         const order = await Order.findOneAndUpdate(
//             { 
//                 _id: orderId, 
//                 restaurantId: seller.managedRestaurant,
//                 status: 'pending'
//             },
//             { status: 'confirmed' },
//             { new: true }
//         ).populate('userId');
//         if (!order) {
//             return res.status(404).json({ message: 'Order not found or not under your management' });
//         }

//           const pointsToAdd = Math.floor(order.totalAmount / 40) * 5;
        
//         if (pointsToAdd > 0) {
//             await User.findByIdAndUpdate(
//                 order.userId._id,
//                 { $inc: { points: pointsToAdd } }
//             );
//         }

//         res.status(200).json({ message: 'Cash payment confirmed successfully', 
//           order: {
//                 id: order._id,
//                 status: order.status,
//                 totalAmount: order.totalAmount
//             },
//             pointsAdded: pointsToAdd
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//          res.status(500).json({
//             success: false,
//             message: 'Server error',
//             error: error.message
//         });
//     }
// };



exports.confirmCashPayment = async (req, res) => {
    const { orderId } = req.params;
    const seller = req.user;

    try {
        const order = await Order.findOneAndUpdate(
            { 
                _id: orderId, 
                restaurantId: seller.managedRestaurant,
                status: 'pending'
            },
            { status: 'confirmed' },
            { new: true }
        ).populate('userId');

        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found or not under your management' 
            });
        }

        const pointsToAdd = Math.floor(order.totalAmount / 40) * 5;
        
        if (pointsToAdd > 0) {
            await User.findByIdAndUpdate(
                order.userId._id,
                { $inc: { points: pointsToAdd } }
            );
        }

        res.status(200).json({ 
            success: true,
            message: 'Cash payment confirmed successfully',
            order: {
                id: order._id,
                status: order.status,
                totalAmount: order.totalAmount
            },
            pointsAdded: pointsToAdd
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};


exports.getLowStockItems = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(400).json({ 
        success: false,
        message: 'No restaurant assigned to this seller' 
      });
    }

    const LOW_STOCK_THRESHOLD = 7;
    

    const allItems = await Image.find({
      restaurant: seller.managedRestaurant
    }).select('name quantity price imageUrl category');


    const lowStockItems = allItems.filter(item => {
      const quantity = parseFloat(item.quantity);
      return quantity <= LOW_STOCK_THRESHOLD;
    });

    res.status(200).json({
      success: true,
      threshold: LOW_STOCK_THRESHOLD,
      count: lowStockItems.length,
      items: lowStockItems
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};



exports.getOutOfStockItems = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(400).json({ 
        success: false,
        message: 'No restaurant assigned to this seller' 
      });
    }
    

    const allItems = await Image.find({
      restaurant: seller.managedRestaurant
    }).select('name quantity price imageUrl category');


    const outOfStockItems = allItems.filter(item => {
      const quantity = parseFloat(item.quantity);
      return quantity === 0;
    });

    res.status(200).json({
      success: true,
      count: outOfStockItems.length,
      items: outOfStockItems
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


exports.getOrdersStats = async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned' });
        }


        const stats = await Order.aggregate([
            {
                $match: {
                    restaurantId: seller.managedRestaurant
                }
            },
            {
                $group: {
                    _id: null, 
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" },
                    avgOrderValue: { $avg: "$totalAmount" }
                }
            }
        ]);

        // إذا لم توجد طلبات
        const result = stats[0] || { 
            totalOrders: 0, 
            totalRevenue: 0, 
            avgOrderValue: 0 
        };

        res.status(200).json({
            success: true,
            stats: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders stats',
            error: error.message
        });
    }
};



// exports.getMonthlyEarningsWithPaymentMethods = async (req, res) => {
//     try {
//         const seller = req.user;
        
//         if (!seller.managedRestaurant) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'No restaurant assigned to this seller' 
//             });
//         }

//         const now = new Date();
//         const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
//         const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

//         // Get current month earnings and payment methods
//         const currentMonthStats = await Order.aggregate([
//             {
//                 $match: {
//                     restaurantId: seller.managedRestaurant,
//                     createdAt: { $gte: currentMonthStart },
//                     status: { $ne: 'cancelled' }
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalEarnings: { $sum: "$totalAmount" },
//                     cashOrders: {
//                         $sum: {
//                             $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$totalAmount", 0]
//                         }
//                     },
//                     cardOrders: {
//                         $sum: {
//                             $cond: [{ $eq: ["$paymentMethod", "card"] }, "$totalAmount", 0]
//                         }
//                     },
//                     cashCount: {
//                         $sum: {
//                             $cond: [{ $eq: ["$paymentMethod", "cash"] }, 1, 0]
//                         }
//                     },
//                     cardCount: {
//                         $sum: {
//                             $cond: [{ $eq: ["$paymentMethod", "card"] }, 1, 0]
//                         }
//                     }
//                 }
//             }
//         ]);

//         // Get last month earnings for comparison
//         const lastMonthStats = await Order.aggregate([
//             {
//                 $match: {
//                     restaurantId: seller.managedRestaurant,
//                     createdAt: { $gte: lastMonthStart, $lt: currentMonthStart },
//                     status: { $ne: 'cancelled' }
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalEarnings: { $sum: "$totalAmount" }
//                 }
//             }
//         ]);

//         // Format the response
//         const current = currentMonthStats[0] || {
//             totalEarnings: 0,
//             cashOrders: 0,
//             cardOrders: 0,
//             cashCount: 0,
//             cardCount: 0
//         };

//         const last = lastMonthStats[0] || { totalEarnings: 0 };

//         // Calculate percentage change
//         let percentageChange = 0;
//         if (last.totalEarnings > 0) {
//             percentageChange = ((current.totalEarnings - last.totalEarnings) / last.totalEarnings) * 100;
//         } else if (current.totalEarnings > 0) {
//             percentageChange = 100;
//         }

//         res.status(200).json({
//             success: true,
//             data: {
//                 currentMonth: {
//                     totalEarnings: current.totalEarnings,
//                     cashEarnings: current.cashOrders,
//                     cardEarnings: current.cardOrders,
//                     cashOrdersCount: current.cashCount,
//                     cardOrdersCount: current.cardCount,
//                     currency: "EGP"
//                 },
//                 comparison: {
//                     percentageChange: percentageChange.toFixed(2) + '%',
//                     changeDirection: percentageChange >= 0 ? 'increase' : 'decrease'
//                 }
//             }
//         });

//     } catch (error) {
//         console.error("Error in getMonthlyEarningsWithPaymentMethods:", error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch monthly earnings',
//             error: error.message
//         });
//     }
// };


// exports.getSimplifiedMonthlyEarnings = async (req, res) => {
//     try {
//         const seller = req.user;
        
//         if (!seller.managedRestaurant) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'No restaurant assigned to this seller' 
//             });
//         }

//         const now = new Date();
//         const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
//         const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

//         // Get current month earnings
//         const currentMonthStats = await Order.aggregate([
//             {
//                 $match: {
//                     restaurantId: seller.managedRestaurant,
//                     createdAt: { $gte: currentMonthStart },
//                     status: { $ne: 'cancelled' }
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalEarnings: { $sum: "$totalAmount" }
//                 }
//             }
//         ]);

//         // Get last month earnings for comparison
//         const lastMonthStats = await Order.aggregate([
//             {
//                 $match: {
//                     restaurantId: seller.managedRestaurant,
//                     createdAt: { $gte: lastMonthStart, $lt: currentMonthStart },
//                     status: { $ne: 'cancelled' }
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalEarnings: { $sum: "$totalAmount" }
//                 }
//             }
//         ]);

//         const current = currentMonthStats[0] || { totalEarnings: 0 };
//         const last = lastMonthStats[0] || { totalEarnings: 0 };

//         // Calculate percentage change
//         let percentageChange = "0.00%";
//         if (last.totalEarnings > 0) {
//             percentageChange = ((current.totalEarnings - last.totalEarnings) / last.totalEarnings * 100).toFixed(2) + "%";
//         } else if (current.totalEarnings > 0) {
//             percentageChange = "100.00%";
//         }

//         res.status(200).json({
//             success: true,
//             totalEarnings: current.totalEarnings,
//             percentageChange: percentageChange
//         });

//     } catch (error) {
//         console.error("Error in getSimplifiedMonthlyEarnings:", error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch monthly earnings',
//             error: error.message
//         });
//     }
// };






exports.getTotalEarningsSinceStart = async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                success: false,
                message: 'No restaurant assigned to this seller' 
            });
        }

        // Get all earnings since beginning (excluding cancelled orders)
        const totalEarningsStats = await Order.aggregate([
            {
                $match: {
                    restaurantId: seller.managedRestaurant,
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$totalAmount" }
                }
            }
        ]);

        const total = totalEarningsStats[0] || { totalEarnings: 0 };

        res.status(200).json({
            success: true,
            totalEarnings: total.totalEarnings,
            message: 'Total earnings since beginning'
        });

    } catch (error) {
        console.error("Error in getTotalEarningsSinceStart:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch total earnings',
            error: error.message
        });
    }
};


exports.getTotalCashEarnings = async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                success: false,
                message: 'No restaurant assigned to this seller' 
            });
        }

        // Aggregate to sum only cash payments
        const cashEarnings = await Order.aggregate([
            {
                $match: {
                    restaurantId: seller.managedRestaurant,
                    status: { $ne: 'cancelled' },
                    paymentMethod: 'cash' 
                }
            },
            {
                $group: {
                    _id: null,
                    totalCash: { $sum: "$totalAmount" }
                }
            }
        ]);

        const total = cashEarnings[0] || { totalCash: 0 };

        res.status(200).json({
            success: true,
            totalCashEarnings: total.totalCash,
            message: 'Total cash earnings retrieved successfully'
        });

    } catch (error) {
        console.error("Error in getTotalCashEarnings:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cash earnings',
            error: error.message
        });
    }
};


exports.getLast7DaysPaidOrders = async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                success: false,
                message: 'No restaurant assigned to this seller' 
            });
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const orders = await Order.aggregate([
            {
                $match: {
                    restaurantId: seller.managedRestaurant,
                    createdAt: { $gte: sevenDaysAgo },
                    status: { $in: ['paid', 'pending'] }
                }
            },
            {
                $project: {
                    _id: 1,
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
                    totalAmount: 1,
                    paymentMethod: 1,
                    status: 1
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        res.status(200).json({
            success: true,
            orders: orders,
            message: 'Last 7 days paid orders retrieved successfully'
        });

    } catch (error) {
        console.error("Error in getLast7DaysPaidOrders:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch last 7 days orders',
            error: error.message
        });
    }
};


exports.getMonthlyRefunds = async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                success: false,
                message: 'No restaurant assigned to this seller' 
            });
        }

        const currentMonthStart = new Date(); 
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const refundsStats = await Order.aggregate([
            {
                $match: {
                    restaurantId: seller.managedRestaurant,
                    createdAt: { $gte: currentMonthStart },
                    status: 'refunded' 
                }
            },
            {
                $group: {
                    _id: null,
                    totalRefundedAmount: { $sum: "$totalAmount" }, 
                    totalRefundedItems: { $sum: { $size: "$items" } } 
                }
            }
        ]);

        const result = refundsStats[0] || { 
            totalRefundedAmount: 0, 
            totalRefundedItems: 0 
        };

        res.status(200).json({
            success: true,
            totalRefundedAmount: result.totalRefundedAmount,
            totalRefundedItems: result.totalRefundedItems,
            message: 'Monthly refunds stats retrieved successfully'
        });

    } catch (error) {
        console.error("Error in getMonthlyRefunds:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch refunds data',
            error: error.message
        });
    }
};


exports.getCurrentMonthOrdersCount = async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                success: false,
                message: 'No restaurant assigned to this seller' 
            });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); 

        const totalOrders = await Order.countDocuments({
            restaurantId: seller.managedRestaurant,
            createdAt: { $gte: startOfMonth, $lte: now },
            status: { $ne: 'cancelled' } 
        });

        res.status(200).json({
            success: true,
            message: 'Total orders count for current month retrieved successfully',
            data: {
                month: now.toLocaleString('default', { month: 'long' }), 
                year: now.getFullYear(),
                totalOrders
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders count',
            error: error.message
        });
    }
};


exports.getRevenueComparison = async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                success: false,
                message: 'No restaurant assigned to this seller' 
            });
        }

        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Get current month revenue
        const currentMonthRevenue = await Order.aggregate([
            {
                $match: {
                    restaurantId: seller.managedRestaurant,
                    createdAt: { $gte: currentMonthStart },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

        // Get last month revenue
        const lastMonthRevenue = await Order.aggregate([
            {
                $match: {
                    restaurantId: seller.managedRestaurant,
                    createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" }
                }
            }
        ]);

        const current = currentMonthRevenue[0]?.total || 0;
        const last = lastMonthRevenue[0]?.total || 0;

        let percentageChange = 0;
        if (last > 0) {
            percentageChange = ((current - last) / last) * 100;
        } else if (current > 0) {
            percentageChange = 100;
        }

        res.status(200).json({
            success: true,
            currentMonthRevenue: current,
            percentageChange: percentageChange.toFixed(2),
            currency: "EGP"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue comparison',
            error: error.message
        });
    }
};


exports.getBuyerEmailsCount = async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                success: false,
                message: 'No restaurant assigned to this seller' 
            });
        }


        const now = new Date();
        const startOfCurrentWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfLastWeek = new Date(new Date(startOfCurrentWeek).setDate(startOfCurrentWeek.getDate() - 7));


        const currentWeekOrders = await Order.find({ 
            restaurantId: seller.managedRestaurant,
            createdAt: { $gte: startOfCurrentWeek },
            status: { $ne: 'cancelled' }
        }).select('userId');


        const lastWeekOrders = await Order.find({ 
            restaurantId: seller.managedRestaurant,
            createdAt: { $gte: startOfLastWeek, $lt: startOfCurrentWeek },
            status: { $ne: 'cancelled' }
        }).select('userId');


        const currentWeekBuyers = [...new Set(currentWeekOrders.map(order => order.userId.toString()))];
        

        const lastWeekBuyers = [...new Set(lastWeekOrders.map(order => order.userId.toString()))];


        const currentWeekUsers = await User.find({ 
            _id: { $in: currentWeekBuyers }
        }).select('email');


        let percentageChange = 0;
        if (lastWeekBuyers.length > 0) {
            percentageChange = ((currentWeekBuyers.length - lastWeekBuyers.length) / lastWeekBuyers.length) * 100;
        } else if (currentWeekBuyers.length > 0) {
            percentageChange = 100; 
        }

        res.status(200).json({
            success: true,
            count: currentWeekUsers.length,
            buyers: currentWeekUsers.map(user => user.email),
            percentageChange: percentageChange.toFixed(2) + '%',
            changeDirection: percentageChange >= 0 ? 'increase' : 'decrease'
        });

    } catch (error) {
        console.error("Error in getBuyerEmailsCount:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch buyer emails count',
            error: error.message
        });
    }
};



exports.getTopSellingProductsWithPaymentMethods = async (req, res) => {
  try {
    const seller = req.user;
    
    if (!seller.managedRestaurant) {
      return res.status(400).json({ 
        success: false,
        message: 'No restaurant assigned to this seller' 
      });
    }


    const topProducts = await Order.aggregate([
      { 
        $match: { 
          restaurantId: seller.managedRestaurant,
          status: { $ne: 'cancelled' } 
        } 
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemId',
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          cashOrders: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$items.quantity', 0]
            }
          },
          cardOrders: {
            $sum: {
              $cond: [{ $eq: ['$paymentMethod', 'card'] }, '$items.quantity', 0]
            }
          }
        }
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'images',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: '$productDetails.name',
          productImage: '$productDetails.imageUrl',
          productPrice: '$productDetails.price',
          totalUnitsSold: 1,
          totalRevenue: 1,
          totalPaymentMethods: {
            $add: ['$cashOrders', '$cardOrders']
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      topProducts
    });

  } catch (error) {
    console.error('Error fetching top selling products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top selling products',
      error: error.message
    });
  }
};


