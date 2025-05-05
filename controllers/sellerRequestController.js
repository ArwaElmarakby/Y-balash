const SellerRequest = require('../models/sellerRequestModel');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const bcrypt = require('bcrypt');

// إنشاء طلب بائع جديد
exports.createSellerRequest = async (req, res) => {
  const { email, phone, restaurantId } = req.body;

  try {
    // التحقق من وجود المطعم
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // التحقق من عدم وجود طلب مسبق بنفس الإيميل
    const existingRequest = await SellerRequest.findOne({ email });
    if (existingRequest) {
      return res.status(400).json({ message: 'Request already exists for this email' });
    }

    // إنشاء الطلب الجديد
    const newRequest = new SellerRequest({ email, phone, restaurantId });
    await newRequest.save();

    res.status(201).json({ 
      message: 'Seller request submitted successfully',
      request: newRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// عرض جميع طلبات البائعين
exports.getAllSellerRequests = async (req, res) => {
  try {
    const requests = await SellerRequest.find()
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// موافقة الأدمن على طلب بائع
exports.approveSellerRequest = async (req, res) => {
  const { requestId, password } = req.body;

  try {
    // العثور على الطلب
    const request = await SellerRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // التحقق من أن الطلب لم يتم الموافقة عليه مسبقًا
    if (request.status === 'approved') {
      return res.status(400).json({ message: 'Request already approved' });
    }

    // التحقق من عدم وجود مستخدم بنفس الإيميل
    const existingUser = await User.findOne({ email: request.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // إنشاء المستخدم الجديد
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email: request.email,
      phone: request.phone,
      password: hashedPassword,
      isSeller: true,
      managedRestaurant: request.restaurantId
    });

    await newUser.save();

    // تحديث حالة الطلب إلى "موافق عليه"
    request.status = 'approved';
    await request.save();

    res.status(200).json({ 
      message: 'Seller request approved successfully',
      user: {
        email: newUser.email,
        isSeller: newUser.isSeller,
        managedRestaurant: newUser.managedRestaurant
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};