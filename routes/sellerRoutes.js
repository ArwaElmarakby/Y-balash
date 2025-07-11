const express = require('express');
const router = express.Router();
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const { authMiddleware } = require('./authRoutes');
const sellerMiddleware = require('../middleware/sellerMiddleware');
const Image = require('../models/imageModel'); 
const sellerController = require('../controllers/sellerController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { confirmCashPayment } = require('../controllers/sellerController');
const { addReturn, getReturnsSummary } = require('../controllers/returnController');
const { getCurrentMonthOrdersCount } = require('../controllers/sellerController');
const adminMiddleware = require('../middleware/adminMiddleware');


router.post('/promote-to-seller', authMiddleware, sellerMiddleware, async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isSeller = true;
        await user.save();

        res.status(200).json({ message: 'User promoted to seller successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

router.post('/add-product', authMiddleware, sellerMiddleware, (req, res) => {

    res.status(200).json({ message: 'Product added successfully (seller only)' });
});


router.post('/become-seller', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user.isSeller) {
            return res.status(400).json({ message: 'You are already a seller!' });
        }

        user.isSeller = true;
        await user.save();

        res.status(200).json({ 
            message: 'Congratulations! You are now a seller.',
            user: {
                _id: user._id,
                email: user.email,
                isSeller: true
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



router.get('/orders', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to you yet' });
        }

        const orders = await Order.find({ restaurantId: seller.managedRestaurant })
            .populate('userId', 'email phone')
            .populate('items.itemId', 'name price imageUrl')
            .sort({ createdAt: -1 }); 

        res.status(200).json({
            restaurant: seller.managedRestaurant,
            totalOrders: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.put('/orders/:orderId/status', authMiddleware, sellerMiddleware, async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            message: 'Invalid status',
            validStatuses
        });
    }

    try {
        const order = await Order.findOneAndUpdate(
            { 
                _id: orderId,
                restaurantId: req.user.managedRestaurant 
            },
            { status },
            { new: true }
        ).populate('userId', 'email phone');

        if (!order) {
            return res.status(404).json({ 
                message: 'Order not found or not under your management' 
            });
        }

        res.status(200).json({ 
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.post('/products', authMiddleware, sellerMiddleware, async (req, res) => {
    const { name, price, quantity, description } = req.body;
    const seller = req.user;

    if (!seller.managedRestaurant) {
        return res.status(403).json({ 
            message: 'You must be assigned to a restaurant to add products' 
        });
    }

    if (!name || !price || !quantity) {
        return res.status(400).json({ 
            message: 'Name, price and quantity are required' 
        });
    }

    try {
        const newProduct = new Image({
            name,
            price,
            quantity,
            description: description || '',
            restaurant: seller.managedRestaurant
        });

        await newProduct.save();

        res.status(201).json({
            message: 'Product added successfully',
            product: newProduct
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/stats', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ 
                message: 'No restaurant assigned to you yet' 
            });
        }


        const totalOrders = await Order.countDocuments({ 
            restaurantId: seller.managedRestaurant 
        });

        const pendingOrders = await Order.countDocuments({ 
            restaurantId: seller.managedRestaurant,
            status: 'pending'
        });

        const completedOrders = await Order.countDocuments({ 
            restaurantId: seller.managedRestaurant,
            status: 'delivered'
        });


        const totalProducts = await Image.countDocuments({
            restaurant: seller.managedRestaurant
        });

        res.status(200).json({
            restaurant: seller.managedRestaurant,
            stats: {
                totalOrders,
                pendingOrders,
                completedOrders,
                completionRate: totalOrders > 0 
                    ? Math.round((completedOrders / totalOrders) * 100) 
                    : 0,
                totalProducts
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});





// router.get('/monthly-earnings', authMiddleware, sellerMiddleware, async (req, res) => {
//     try {
//         const seller = req.user;
        
//         if (!seller.managedRestaurant) {
//             return res.status(400).json({ message: 'No restaurant assigned to you' });
//         }

//         const currentDate = new Date();
//         const currentMonth = currentDate.getMonth();
//         const currentYear = currentDate.getFullYear();

        
//         const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
//         const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);


//         const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
//         const endOfLastMonth = new Date(currentYear, currentMonth, 0);


//         const [currentMonthEarnings, lastMonthEarnings] = await Promise.all([
//             Order.aggregate([
//                 { 
//                     $match: { 
//                         restaurantId: seller.managedRestaurant,
//                         createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
//                         status: 'delivered' 
//                     }
//                 },
//                 { $group: { _id: null, total: { $sum: "$totalAmount" } } }
//             ]),
//             Order.aggregate([
//                 { 
//                     $match: { 
//                         restaurantId: seller.managedRestaurant,
//                         createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
//                         status: 'delivered'
//                     }
//                 },
//                 { $group: { _id: null, total: { $sum: "$totalAmount" } } }
//             ])
//         ]);


//         const currentEarnings = currentMonthEarnings[0]?.total || 0;
//         const lastEarnings = lastMonthEarnings[0]?.total || 0;


//         let percentageChange = 0;
//         if (lastEarnings > 0) {
//             percentageChange = ((currentEarnings - lastEarnings) / lastEarnings) * 100;
//         } else if (currentEarnings > 0) {
//             percentageChange = 100; 
//         }

//         res.status(200).json({
//             message: 'Monthly earnings retrieved successfully',
//             earnings: {
//                 currentMonth: {
//                     total: currentEarnings,
//                     currency: 'EGP' 
//                 },
//                 lastMonth: {
//                     total: lastEarnings,
//                     currency: 'EGP'
//                 },
//                 percentageChange: percentageChange.toFixed(2) + '%'
//             }
//         });

//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// });


router.get('/low-stock-count', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to you' });
        }

        const LOW_STOCK_THRESHOLD = 12; 

        const lowStockItemsCount = await Image.countDocuments({
            restaurant: seller.managedRestaurant,
            quantity: { $lte: LOW_STOCK_THRESHOLD }
        });

        res.status(200).json({
            message: 'Low stock items count retrieved successfully',
            lowStockItemsCount,
            threshold: LOW_STOCK_THRESHOLD
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



router.get('/products-stats', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to you' });
        }

        const now = new Date();
        const startOfCurrentWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfLastWeek = new Date(now.setDate(now.getDate() - 7));


        const totalProducts = await Image.countDocuments({
            restaurant: seller.managedRestaurant
        });


        const productsAddedThisWeek = await Image.countDocuments({
            restaurant: seller.managedRestaurant,
            createdAt: { $gte: startOfCurrentWeek }
        });


        const productsAddedLastWeek = await Image.countDocuments({
            restaurant: seller.managedRestaurant,
            createdAt: { 
                $gte: startOfLastWeek,
                $lt: startOfCurrentWeek
            }
        });


        let percentageChange = 0;
        if (productsAddedLastWeek > 0) {
            percentageChange = ((productsAddedThisWeek - productsAddedLastWeek) / productsAddedLastWeek) * 100;
        } else if (productsAddedThisWeek > 0) {
            percentageChange = 100;
        }

        res.status(200).json({
            message: 'Products statistics retrieved successfully',
            stats: {
                totalProducts,
                currentWeekAdditions: productsAddedThisWeek,
                lastWeekAdditions: productsAddedLastWeek,
                percentageChange: percentageChange.toFixed(2) + '%',
                restaurant: await Restaurant.findById(seller.managedRestaurant).select('name')
            }
        });

    } catch (error) {
        console.error("Error in products-stats:", error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message
        });
    }
});




router.get('/restaurant-stats', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to you' });
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
                    pendingOrders: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
                        }
                    },
                    shippedOrders: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "shipped"] }, 1, 0]
                        }
                    },
                    deliveredOrders: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "delivered"] }, 1, 0]
                        }
                    }
                }
            }
        ]);


        const result = stats[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            pendingOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0
        };

        res.status(200).json({
            message: 'Restaurant statistics retrieved successfully',
            stats: {
                totalOrders: result.totalOrders,
                pendingOrders: result.pendingOrders,
                shippedOrders: result.shippedOrders,
                deliveredOrders: result.deliveredOrders,
                totalRevenue: result.totalRevenue,
                currency: "EGP" 
            }
        });

    } catch (error) {
        console.error("Error fetching restaurant stats:", error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message
        });
    }
});



router.get('/orders-details', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
        const seller = req.user;
        
        if (!seller.managedRestaurant) {
            return res.status(400).json({ message: 'No restaurant assigned to you' });
        }

        const orders = await Order.find({
            restaurantId: seller.managedRestaurant
        })
        .populate('userId', 'email') 
        .populate('items.itemId', 'name price') 
        .sort({ createdAt: -1 }); 

        const formattedOrders = orders.map(order => ({
            orderId: order._id,
            clientEmail: order.userId.email,
            products: order.items.map(item => ({
                name: item.itemId.name,
                price: item.itemId.price,
                quantity: item.quantity
            })),
            totalAmount: order.totalAmount,
            status: order.status,
            orderDate: order.createdAt,
            currency: "EGP"
        }));

        res.status(200).json({
            message: 'Orders details retrieved successfully',
            count: orders.length,
            orders: formattedOrders
        });

    } catch (error) {
        console.error("Error fetching orders details:", error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message
        });
    }
});



router.get('/current-balance', authMiddleware, sellerMiddleware, async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.user.managedRestaurant);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
  
      res.status(200).json({
        balance: restaurant.balance,
        currency: 'EGP'
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });





  router.get('/available-for-withdrawal', 
    authMiddleware, 
    sellerMiddleware, 
    async (req, res) => {
      try {
        const restaurant = await Restaurant.findById(req.user.managedRestaurant);
        if (!restaurant) {
          return res.status(404).send('0'); 
        }
  

        const available = restaurant.balance - (restaurant.pendingWithdrawal || 0);
        
        res.status(200).send(available.toString()); 
      } catch (error) {
        res.status(500).send('0'); 
      }
    }
  );



  
//   router.get('/monthly-earnings',
//     authMiddleware,
//     sellerMiddleware,
//     sellerController.getMonthlyEarnings
//   );

  

  router.get('/earnings/current',
    authMiddleware,
    sellerMiddleware,
    sellerController.getCurrentMonthEarnings
  );



  router.get('/orders/stats',
    authMiddleware,
    sellerMiddleware,
    sellerController.getOrderStats
  );
  


  router.get('/orders/average-value',
    authMiddleware,
    sellerMiddleware,
    sellerController.getAverageOrderValue
  );
  


  router.get('/payouts/recent', 
    authMiddleware,
    sellerMiddleware,
    sellerController.getRecentPayouts
  );
  
  router.post('/payouts/request', 
    authMiddleware,
    sellerMiddleware,
    sellerController.requestPayout
  );


  router.get('/refunds/monthly',
    authMiddleware,
    sellerMiddleware,
    sellerController.getMonthlyRefunds
  );


  router.get('/analytics/best-seller',
    authMiddleware,
    sellerMiddleware,
    sellerController.getBestSeller
  );



  router.get('/orders/completed-this-month', 
    authMiddleware,
    sellerMiddleware,
    sellerController.getCompletedOrdersThisMonth
);
  


router.get('/notifications', 
    authMiddleware,
    sellerMiddleware,
    sellerController.getSellerNotifications
);


router.get('/profile',
    authMiddleware,
    sellerMiddleware,
    sellerController.getSellerProfile
);



router.put('/profile/language',
    authMiddleware,
    sellerMiddleware,
    sellerController.updateLanguage
);



router.get('/my-restaurant', 
    authMiddleware,
    sellerMiddleware,
    sellerController.getMyRestaurant
  );



  router.get('/payment-settings',
    authMiddleware,
    sellerMiddleware,
    sellerController.getPaymentSettings
  );
  
  router.put('/payment-settings',
    authMiddleware,
    sellerMiddleware,
    sellerController.updatePaymentSettings
  );



//   router.get('/low-stock-items',
//     authMiddleware,
//     sellerMiddleware,
//     sellerController.getLowStockItems
//   );


//   router.get('/stock-stats',
//     authMiddleware,
//     sellerMiddleware,
//     sellerController.getStockStats
//   );


  router.get('/inventory',
    authMiddleware,
    sellerMiddleware,
    sellerController.getInventoryItems
  );



  router.get('/restaurant-products',
    authMiddleware,
    sellerMiddleware,
    sellerController.getRestaurantProducts
  );
  

  router.get('/revenue-stats',
    authMiddleware,
    sellerMiddleware,
    sellerController.getRevenueStats
  );



  router.get('/new-customers-stats',
    authMiddleware,
    sellerMiddleware,
    sellerController.getNewCustomersStats
  );



  router.get('/top-product',
    authMiddleware,
    sellerMiddleware,
    sellerController.getTopProduct
  );


//   router.get('/top-selling-products',
//     authMiddleware,
//     sellerMiddleware,
//     sellerController.getTopSellingProducts
//   );



  router.get('/balance',
    authMiddleware,
    sellerMiddleware,
    sellerController.getBalance
  );
  
  router.post('/withdraw',
    authMiddleware,
    sellerMiddleware,
    sellerController.requestWithdrawal
  );
  
  router.get('/transactions',
    authMiddleware,
    sellerMiddleware,
    sellerController.getTransactionHistory
  );

  router.get('/sales-analytics',
    authMiddleware,
    sellerMiddleware,
    sellerController.getSalesAnalytics
  );

  router.get('/revenue-trends',
    authMiddleware,
    sellerMiddleware,
    sellerController.getRevenueTrends
  );


  router.get('/revenue-peak-trends',
    authMiddleware,
    sellerMiddleware,
    sellerController.getRevenuePeakTrends
  );



  router.get('/customer-analytics',
    authMiddleware,
    sellerMiddleware,
    sellerController.getCustomerAnalytics
  );
  router.post('/approve-seller', async (req, res) => {
    try {
        const { email, password, restaurantId, name } = req.body;
        
        if (!email || !password || !restaurantId) {
            return res.status(400).json({ 
                success: false,
                error: "Email, password, and restaurant ID are required" 
            });
        }

        let user = await User.findOne({ email });


        const restaurant = await Restaurant.findById(restaurantId).select('name');
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                error: "Restaurant not found"
            });
        }

        if (user) {

            user.isSeller = true;
            user.managedRestaurant = restaurantId;
            user.password = password; 
            await user.save();
        } else {

            user = new User({
                email,
                password, 
                name: name || "New Seller",
                isSeller: true,
                managedRestaurant: restaurantId
            });
            await user.save();
        }

        res.json({ 
            success: true,
            message: "Seller approved successfully",
            user: {
                email: user.email,
                name: user.name,
                isSeller: user.isSeller,
                managedRestaurant: {
                    id: restaurantId,
                    name: restaurant.name 
                }
            }
        });

    } catch (error) {
        console.error("Error approving seller:", error);
        res.status(500).json({ 
            success: false,
            error: "Internal server error",
            details: error.message 
        });
    }
});

  router.post('/seller-login', async (req, res) => {
    try {
      const { email, password } = req.body;
  

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
  

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
  

      if (!user.isSeller) {
        return res.status(403).json({ error: "Access denied. Not a seller." });
      }
  

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
  

      const token = jwt.sign(
        { 
          userId: user._id,
          isSeller: user.isSeller,
          restaurantId: user.managedRestaurant 
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
  

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          restaurantId: user.managedRestaurant
        }
      });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});


router.post('/confirm-cash-payment/:orderId', authMiddleware, sellerMiddleware, confirmCashPayment);


router.get('/low-stock-items',
  authMiddleware,
  sellerMiddleware,
  sellerController.getLowStockItems
);


router.get('/out-of-stock-items',
  authMiddleware,
  sellerMiddleware,
  sellerController.getOutOfStockItems
);

// router.get('/orders/stats', authMiddleware, sellerMiddleware, async (req, res) => {
//     try {
//         const seller = req.user;
        
//         if (!seller.managedRestaurant) {
//             return res.status(400).json({ message: 'No restaurant assigned' });
//         }

//         const stats = await Order.aggregate([
//             {
//                 $match: {
//                     restaurantId: seller.managedRestaurant
//                 }
//             },
//             {
//                 $group: {
//                     _id: null,
//                     totalOrders: { $sum: 1 },
//                     cashOrders: {
//                         $sum: {
//                             $cond: [{ $eq: ["$paymentMethod", "cash"] }, 1, 0]
//                         }
//                     },
//                     cardOrders: {
//                         $sum: {
//                             $cond: [{ $eq: ["$paymentMethod", "card"] }, 1, 0]
//                         }
//                     }
//                 }
//             }
//         ]);

//         const result = stats[0] || {
//             totalOrders: 0,
//             cashOrders: 0,
//             cardOrders: 0
//         };

//         res.status(200).json({
//             success: true,
//             stats: result
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching order stats',
//             error: error.message
//         });
//     }
// });



router.get('/orders/stats',
    authMiddleware,
    sellerMiddleware,
    sellerController.getOrdersStats
);


// router.get('/monthly-earnings-details',
//     authMiddleware,
//     sellerMiddleware,
//     sellerController.getMonthlyEarningsWithPaymentMethods
// );


router.get('/simplified-monthly-earnings',
    authMiddleware,
    sellerMiddleware,
    sellerController.getSimplifiedMonthlyEarnings
);


router.get('/earnings/breakdown', 
    authMiddleware,
    sellerMiddleware,
    async (req, res) => {
        try {
            const seller = req.user;
            
            if (!seller.managedRestaurant) {
                return res.status(400).json({ 
                    success: false,
                    message: 'No restaurant assigned to this seller' 
                });
            }

            const result = await Order.aggregate([
                {
                    $match: {
                        restaurantId: seller.managedRestaurant,
                        status: 'delivered'
                    }
                },
                {
                    $group: {
                        _id: "$paymentMethod", 
                        total: { $sum: "$totalAmount" },
                        count: { $sum: 1 } 
                    }
                },
                {
                    $project: {
                        paymentMethod: "$_id",
                        total: 1,
                        count: 1,
                        _id: 0
                    }
                }
            ]);


            const response = {
                success: true,
                currency: "EGP",
                cash: {
                    total: result.find(r => r.paymentMethod === 'cash')?.total || 0,
                    ordersCount: result.find(r => r.paymentMethod === 'cash')?.count || 0
                },
                card: {
                    total: result.find(r => r.paymentMethod === 'card')?.total || 0,
                    ordersCount: result.find(r => r.paymentMethod === 'card')?.count || 0
                },
                totalEarnings: result.reduce((sum, item) => sum + item.total, 0)
            };

            res.status(200).json(response);

        } catch (error) {
            console.error("Error fetching earnings breakdown:", error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch earnings breakdown',
                error: error.message
            });
        }
    }
);


router.get('/total-earnings-since-start',
    authMiddleware,
    sellerMiddleware,
    sellerController.getTotalEarningsSinceStart
);


router.get('/total-cash-earnings',
    authMiddleware,
    sellerMiddleware,
    sellerController.getTotalCashEarnings
);


router.get('/last-7-days-orders',
    authMiddleware,
    sellerMiddleware,
    sellerController.getLast7DaysPaidOrders
);




router.get('/monthly-refunds',
    authMiddleware,
    sellerMiddleware,
    sellerController.getMonthlyRefunds
);


router.post('/returns', 
  authMiddleware,
  sellerMiddleware,
  addReturn
);

// Get returns summary
router.get('/returns/summary', 
  authMiddleware,
  sellerMiddleware,
  getReturnsSummary
);

router.get('/orders/current-month-count', 
    authMiddleware,
    sellerMiddleware,
    getCurrentMonthOrdersCount
);

router.get('/revenue-comparison',
    authMiddleware,
    sellerMiddleware,
    sellerController.getRevenueComparison
);


router.get('/buyers/count',
    authMiddleware,
    sellerMiddleware,
    sellerController.getBuyerEmailsCount
);



router.get('/top-selling-with-payments',
  authMiddleware,
  sellerMiddleware,
  sellerController.getTopSellingProductsWithPaymentMethods
);




router.post("/withdrawal/request",
    authMiddleware,
    sellerMiddleware,
    sellerController.requestWithdrawal);

router.post('/withdrawal/confirm',
    authMiddleware,
    adminMiddleware,
    sellerController.confirmWithdrawal
);

  
module.exports = router;