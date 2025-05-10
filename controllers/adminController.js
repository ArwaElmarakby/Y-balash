const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const Image = require('../models/imageModel');
const Category = require('../models/categoryModel');
const ApprovedSeller = require('../models/approvedSellerModel');
const SellerRequest = require('../models/sellerRequestModel');
const RejectedSeller = require('../models/rejectedSellerModel');


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


exports.getApprovedSellers = async (req, res) => {
    try {
        const approvedSellers = await ApprovedSeller.find()
            .populate('adminId', 'email')
            .populate('restaurantId', 'name')
            .sort({ approvedAt: -1 });

        res.status(200).json({
            success: true,
            count: approvedSellers.length,
            approvedSellers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch approved sellers",
            error: error.message
        });
    }
};


exports.getAllSellerRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    if (status) filter.status = status;

    const requests = await SellerRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('processedBy', 'email')
      .populate('restaurantAssigned', 'name');

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      error: error.message
    });
  }
};



exports.approveSeller = async (req, res) => {
    try {
        const { email, restaurantId, additionalNotes } = req.body;


        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }


        const newApprovedSeller = new ApprovedSeller({
            email,
            adminId: req.user._id,
            restaurantId,
            additionalNotes
        });

        await newApprovedSeller.save();


        user.isSeller = true;
        user.managedRestaurant = restaurantId;
        await user.save();

        res.status(201).json({
            success: true,
            message: "Seller approved successfully",
            approvedSeller: newApprovedSeller
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error approving seller",
            error: error.message
        });
    }
};

exports.approveSellerRequest = async (req, res) => {
  try {
    const { requestId, restaurantId } = req.body;

    const request = await SellerRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: "Request not found" 
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: "Request already processed" 
      });
    }

    // 1. تحديث حالة الطلب
    request.status = 'approved';
    request.processedAt = new Date();
    request.processedBy = req.user._id;
    request.restaurantAssigned = restaurantId;
    await request.save();

    // 2. إنشاء سجل في ApprovedSellers
    const newApprovedSeller = new ApprovedSeller({
      email: request.email,
      adminId: req.user._id,
      restaurantId,
      additionalNotes: request.message
    });
    await newApprovedSeller.save();

    // 3. تحديث مستخدم أو إنشاء جديد
    let user = await User.findOne({ email: request.email });
    if (user) {
      user.isSeller = true;
      user.managedRestaurant = restaurantId;
    } else {
      user = new User({
        email: request.email,
        phone: request.phone,
        isSeller: true,
        managedRestaurant: restaurantId
      });
    }
    await user.save();

    // 4. إرسال بريد الموافقة
    // ... كود إرسال البريد الإلكتروني هنا

    res.status(200).json({
      success: true,
      message: "Seller request approved successfully",
      request,
      user: {
        id: user._id,
        email: user.email,
        isSeller: user.isSeller
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error approving seller request",
      error: error.message
    });
  }
};




exports.rejectSellerRequest = async (req, res) => {
  try {
    const { requestId, reason } = req.body;

    const request = await SellerRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: "Request not found" 
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: "Request already processed" 
      });
    }

    // 1. تحديث حالة الطلب
    request.status = 'rejected';
    request.processedAt = new Date();
    request.processedBy = req.user._id;
    request.rejectionReason = reason;
    await request.save();

    // 2. إنشاء سجل في RejectedSellers
    const newRejectedSeller = new RejectedSeller({
      email: request.email,
      reason,
      rejectedAt: new Date(),
      adminId: req.user._id
    });
    await newRejectedSeller.save();

    // 3. إرسال بريد الرفض
    // ... كود إرسال البريد الإلكتروني هنا

    res.status(200).json({
      success: true,
      message: "Seller request rejected successfully",
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rejecting seller request",
      error: error.message
    });
  }
};

exports.getPendingSellerRequests = async (req, res) => {
  try {
    const pendingRequests = await SellerRequest.find({ status: 'pending' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingRequests.length,
      requests: pendingRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending requests",
      error: error.message
    });
  }
};



