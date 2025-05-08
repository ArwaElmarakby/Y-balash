const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Image = require('../models/imageModel');
const Category = require('../models/categoryModel');


exports.assignSellerToRestaurant = async (req, res) => {
    const { userId, restaurantId } = req.body;

    try {

        const user = await User.findById(userId);
        const restaurant = await Restaurant.findById(restaurantId);

        if (!user || !restaurant) {
            return res.status(404).json({ message: 'User or restaurant not found' });
        }


        user.isSeller = true;
        user.managedRestaurant = restaurantId;
        await user.save();

        res.status(200).json({ 
            message: 'Seller assigned to restaurant successfully',
            user: {
                _id: user._id,
                email: user.email,
                managedRestaurant: restaurant.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


exports.getAllSellers = async (req, res) => {
    try {
        const sellers = await User.find({ isSeller: true })
            .populate('managedRestaurant', 'name');

        res.status(200).json(sellers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


exports.getAdminAlerts = async (req, res) => {
    try {

        const [flaggedProductsCount, pendingSellerApprovals, lowStockItemsCount] = await Promise.all([
            Image.countDocuments({ flagged: true }),
            User.countDocuments({ isSellerRequested: true, isSeller: false }),
            Image.countDocuments({ quantity: { $lte: 10 } })
        ]);

        res.status(200).json({
            success: true,
            alerts: {
                flaggedProducts: flaggedProductsCount,
                pendingSellerApprovals: pendingSellerApprovals,
                lowStockItems: lowStockItemsCount,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        console.error("Error in getAdminAlerts:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin alerts',
            error: error.message
        });
    }
};



exports.getTopCategories = async (req, res) => {
    try {
        const topCategories = await Category.aggregate([
            {
                $lookup: {
                    from: "images",
                    localField: "items",
                    foreignField: "_id",
                    as: "products"
                }
            },
            {
                $project: {
                    name: 1,
                    productCount: { $size: "$products" }
                }
            },
            { $sort: { productCount: -1 } },
            { $limit: 3 }
        ]);

        res.status(200).json({
            success: true,
            topCategories
        });
    } catch (error) {
        console.error("Error fetching top categories:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch top categories",
            error: error.message
        });
    }
};



exports.getRevenueReport = async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        // Get current month revenue
        const currentMonthRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(currentYear, currentMonth, 1),
                        $lt: new Date(currentYear, currentMonth + 1, 1)
                    },
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
                    createdAt: {
                        $gte: new Date(lastMonthYear, lastMonth, 1),
                        $lt: new Date(lastMonthYear, lastMonth + 1, 1)
                    },
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

        const report = {
            currentMonth: {
                name: new Date(currentYear, currentMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                revenue: current,
                currency: 'EGP'
            },
            lastMonth: {
                name: new Date(lastMonthYear, lastMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                revenue: last,
                currency: 'EGP'
            },
            percentageChange: percentageChange.toFixed(2) + '%',
            changeDirection: percentageChange >= 0 ? 'increase' : 'decrease'
        };

        // Format for PDF export
        const pdfData = {
            title: 'Revenue Report',
            date: new Date().toLocaleDateString(),
            data: [
                { label: 'Current Month', value: `${report.currentMonth.revenue.toFixed(2)} EGP` },
                { label: 'Last Month', value: `${report.lastMonth.revenue.toFixed(2)} EGP` },
                { label: 'Percentage Change', value: report.percentageChange }
            ],
            chartData: {
                labels: [report.lastMonth.name, report.currentMonth.name],
                datasets: [{
                    label: 'Revenue (EGP)',
                    data: [report.lastMonth.revenue, report.currentMonth.revenue],
                    backgroundColor: ['#FF6384', '#36A2EB']
                }]
            }
        };

        res.status(200).json({
            success: true,
            report,
            pdfData
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error generating revenue report',
            error: error.message 
        });
    }
};

exports.getUserGrowthReport = async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        // Current month users
        const currentMonthUsers = await User.countDocuments({
            createdAt: {
                $gte: new Date(currentYear, currentMonth, 1),
                $lt: new Date(currentYear, currentMonth + 1, 1)
            }
        });

        // Last month users
        const lastMonthUsers = await User.countDocuments({
            createdAt: {
                $gte: new Date(lastMonthYear, lastMonth, 1),
                $lt: new Date(lastMonthYear, lastMonth + 1, 1)
            }
        });

        let percentageChange = 0;
        if (lastMonthUsers > 0) {
            percentageChange = ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100;
        } else if (currentMonthUsers > 0) {
            percentageChange = 100;
        }

        const report = {
            currentMonth: {
                name: new Date(currentYear, currentMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                newUsers: currentMonthUsers
            },
            lastMonth: {
                name: new Date(lastMonthYear, lastMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                newUsers: lastMonthUsers
            },
            percentageChange: percentageChange.toFixed(2) + '%',
            changeDirection: percentageChange >= 0 ? 'increase' : 'decrease',
            totalUsers: await User.countDocuments()
        };

        // Format for PDF export
        const pdfData = {
            title: 'User Growth Report',
            date: new Date().toLocaleDateString(),
            data: [
                { label: 'Current Month New Users', value: report.currentMonth.newUsers },
                { label: 'Last Month New Users', value: report.lastMonth.newUsers },
                { label: 'Percentage Change', value: report.percentageChange },
                { label: 'Total Users', value: report.totalUsers }
            ],
            chartData: {
                labels: [report.lastMonth.name, report.currentMonth.name],
                datasets: [{
                    label: 'New Users',
                    data: [report.lastMonth.newUsers, report.currentMonth.newUsers],
                    backgroundColor: ['#FFCE56', '#4BC0C0']
                }]
            }
        };

        res.status(200).json({
            success: true,
            report,
            pdfData
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error generating user growth report',
            error: error.message 
        });
    }
};

exports.getProductReport = async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        // Current month product sales
        const currentMonthProducts = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(currentYear, currentMonth, 1),
                        $lt: new Date(currentYear, currentMonth + 1, 1)
                    },
                    status: { $ne: 'cancelled' }
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: null,
                    totalItemsSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
                    uniqueProducts: { $addToSet: "$items.itemId" }
                }
            },
            {
                $project: {
                    totalItemsSold: 1,
                    totalRevenue: 1,
                    uniqueProductsCount: { $size: "$uniqueProducts" }
                }
            }
        ]);

        // Last month product sales
        const lastMonthProducts = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(lastMonthYear, lastMonth, 1),
                        $lt: new Date(lastMonthYear, lastMonth + 1, 1)
                    },
                    status: { $ne: 'cancelled' }
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: null,
                    totalItemsSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
                    uniqueProducts: { $addToSet: "$items.itemId" }
                }
            },
            {
                $project: {
                    totalItemsSold: 1,
                    totalRevenue: 1,
                    uniqueProductsCount: { $size: "$uniqueProducts" }
                }
            }
        ]);

        const current = currentMonthProducts[0] || {
            totalItemsSold: 0,
            totalRevenue: 0,
            uniqueProductsCount: 0
        };

        const last = lastMonthProducts[0] || {
            totalItemsSold: 0,
            totalRevenue: 0,
            uniqueProductsCount: 0
        };

        // Calculate percentage changes
        const itemsSoldChange = last.totalItemsSold > 0 ? 
            ((current.totalItemsSold - last.totalItemsSold) / last.totalItemsSold) * 100 : 
            (current.totalItemsSold > 0 ? 100 : 0);

        const revenueChange = last.totalRevenue > 0 ? 
            ((current.totalRevenue - last.totalRevenue) / last.totalRevenue) * 100 : 
            (current.totalRevenue > 0 ? 100 : 0);

        const productsChange = last.uniqueProductsCount > 0 ? 
            ((current.uniqueProductsCount - last.uniqueProductsCount) / last.uniqueProductsCount) * 100 : 
            (current.uniqueProductsCount > 0 ? 100 : 0);

        // Get top 5 selling products
        const topProducts = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(currentYear, currentMonth, 1),
                        $lt: new Date(currentYear, currentMonth + 1, 1)
                    },
                    status: { $ne: 'cancelled' }
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.itemId",
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "images",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $project: {
                    productName: "$product.name",
                    imageUrl: "$product.imageUrl",
                    totalSold: 1,
                    totalRevenue: 1
                }
            }
        ]);

        const report = {
            currentMonth: {
                name: new Date(currentYear, currentMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                totalItemsSold: current.totalItemsSold,
                totalRevenue: current.totalRevenue,
                uniqueProductsCount: current.uniqueProductsCount,
                currency: 'EGP'
            },
            lastMonth: {
                name: new Date(lastMonthYear, lastMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                totalItemsSold: last.totalItemsSold,
                totalRevenue: last.totalRevenue,
                uniqueProductsCount: last.uniqueProductsCount,
                currency: 'EGP'
            },
            percentageChanges: {
                itemsSold: itemsSoldChange.toFixed(2) + '%',
                revenue: revenueChange.toFixed(2) + '%',
                uniqueProducts: productsChange.toFixed(2) + '%'
            },
            topProducts
        };

        // Format for PDF export
        const pdfData = {
            title: 'Product Sales Report',
            date: new Date().toLocaleDateString(),
            data: [
                { label: 'Current Month Items Sold', value: report.currentMonth.totalItemsSold },
                { label: 'Last Month Items Sold', value: report.lastMonth.totalItemsSold },
                { label: 'Items Sold Change', value: report.percentageChanges.itemsSold },
                { label: 'Current Month Revenue', value: `${report.currentMonth.totalRevenue.toFixed(2)} EGP` },
                { label: 'Last Month Revenue', value: `${report.lastMonth.totalRevenue.toFixed(2)} EGP` },
                { label: 'Revenue Change', value: report.percentageChanges.revenue },
                { label: 'Current Month Unique Products', value: report.currentMonth.uniqueProductsCount },
                { label: 'Last Month Unique Products', value: report.lastMonth.uniqueProductsCount },
                { label: 'Unique Products Change', value: report.percentageChanges.uniqueProducts }
            ],
            chartData: {
                labels: ['Items Sold', 'Revenue (EGP)', 'Unique Products'],
                datasets: [
                    {
                        label: report.lastMonth.name,
                        data: [
                            report.lastMonth.totalItemsSold,
                            report.lastMonth.totalRevenue,
                            report.lastMonth.uniqueProductsCount
                        ],
                        backgroundColor: '#FF6384'
                    },
                    {
                        label: report.currentMonth.name,
                        data: [
                            report.currentMonth.totalItemsSold,
                            report.currentMonth.totalRevenue,
                            report.currentMonth.uniqueProductsCount
                        ],
                        backgroundColor: '#36A2EB'
                    }
                ]
            },
            topProducts: report.topProducts.map(product => ({
                name: product.productName,
                sold: product.totalSold,
                revenue: `${product.totalRevenue.toFixed(2)} EGP`
            }))
        };

        res.status(200).json({
            success: true,
            report,
            pdfData
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error generating product report',
            error: error.message 
        });
    }
};

exports.getOrderReport = async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        // Current month orders
        const currentMonthOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(currentYear, currentMonth, 1),
                        $lt: new Date(currentYear, currentMonth + 1, 1)
                    }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);

        // Last month orders
        const lastMonthOrders = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(lastMonthYear, lastMonth, 1),
                        $lt: new Date(lastMonthYear, lastMonth + 1, 1)
                    }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);

        // Format order status data
        const formatOrderData = (orders) => {
            const statuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
            const result = {};
            
            statuses.forEach(status => {
                const found = orders.find(o => o._id === status);
                result[status] = {
                    count: found?.count || 0,
                    totalAmount: found?.totalAmount || 0
                };
            });

            result.total = {
                count: orders.reduce((sum, o) => sum + o.count, 0),
                totalAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
            };

            return result;
        };

        const current = formatOrderData(currentMonthOrders);
        const last = formatOrderData(lastMonthOrders);

        // Calculate percentage changes
        const totalCountChange = last.total.count > 0 ? 
            ((current.total.count - last.total.count) / last.total.count) * 100 : 
            (current.total.count > 0 ? 100 : 0);

        const totalAmountChange = last.total.totalAmount > 0 ? 
            ((current.total.totalAmount - last.total.totalAmount) / last.total.totalAmount) * 100 : 
            (current.total.totalAmount > 0 ? 100 : 0);

        const report = {
            currentMonth: {
                name: new Date(currentYear, currentMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                orders: current,
                currency: 'EGP'
            },
            lastMonth: {
                name: new Date(lastMonthYear, lastMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                orders: last,
                currency: 'EGP'
            },
            percentageChanges: {
                totalCount: totalCountChange.toFixed(2) + '%',
                totalAmount: totalAmountChange.toFixed(2) + '%'
            }
        };

        // Format for PDF export
        const pdfData = {
            title: 'Order Report',
            date: new Date().toLocaleDateString(),
            data: [
                { label: 'Current Month Total Orders', value: report.currentMonth.orders.total.count },
                { label: 'Last Month Total Orders', value: report.lastMonth.orders.total.count },
                { label: 'Orders Change', value: report.percentageChanges.totalCount },
                { label: 'Current Month Order Value', value: `${report.currentMonth.orders.total.totalAmount.toFixed(2)} EGP` },
                { label: 'Last Month Order Value', value: `${report.lastMonth.orders.total.totalAmount.toFixed(2)} EGP` },
                { label: 'Order Value Change', value: report.percentageChanges.totalAmount },
                { label: 'Current Month Pending Orders', value: report.currentMonth.orders.pending.count },
                { label: 'Current Month Preparing Orders', value: report.currentMonth.orders.preparing.count },
                { label: 'Current Month Ready Orders', value: report.currentMonth.orders.ready.count },
                { label: 'Current Month Delivered Orders', value: report.currentMonth.orders.delivered.count },
                { label: 'Current Month Cancelled Orders', value: report.currentMonth.orders.cancelled.count }
            ],
            chartData: {
                labels: ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'],
                datasets: [
                    {
                        label: report.lastMonth.name,
                        data: [
                            report.lastMonth.orders.pending.count,
                            report.lastMonth.orders.preparing.count,
                            report.lastMonth.orders.ready.count,
                            report.lastMonth.orders.delivered.count,
                            report.lastMonth.orders.cancelled.count
                        ],
                        backgroundColor: '#FF6384'
                    },
                    {
                        label: report.currentMonth.name,
                        data: [
                            report.currentMonth.orders.pending.count,
                            report.currentMonth.orders.preparing.count,
                            report.currentMonth.orders.ready.count,
                            report.currentMonth.orders.delivered.count,
                            report.currentMonth.orders.cancelled.count
                        ],
                        backgroundColor: '#36A2EB'
                    }
                ]
            }
        };

        res.status(200).json({
            success: true,
            report,
            pdfData
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error generating order report',
            error: error.message 
        });
    }
};

// Combined report for dashboard
exports.getCombinedReport = async (req, res) => {
    try {
        const [revenue, users, products, orders] = await Promise.all([
            this.getRevenueReport({}, res, true),
            this.getUserGrowthReport({}, res, true),
            this.getProductReport({}, res, true),
            this.getOrderReport({}, res, true)
        ]);

        const combinedReport = {
            revenue: revenue.report,
            users: users.report,
            products: products.report,
            orders: orders.report
        };

        res.status(200).json({
            success: true,
            report: combinedReport
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error generating combined report',
            error: error.message 
        });
    }
};

