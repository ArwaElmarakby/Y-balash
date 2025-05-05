const SellerRequest = require('../models/sellerRequestModel');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const bcrypt = require('bcrypt');

// إنشاء طلب بائع جديد
exports.createSellerRequest = async (req, res) => {
  const { name, phone, restaurantId } = req.body;

  try {
    // التحقق من وجود المطعم
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'المطعم غير موجود' });
    }

    // التحقق من عدم وجود طلب مسبق بنفس رقم الهاتف
    const existingRequest = await SellerRequest.findOne({ phone });
    if (existingRequest) {
      return res.status(400).json({ message: 'يوجد طلب مسبق بنفس رقم الهاتف' });
    }

    // إنشاء الطلب الجديد
    const newRequest = new SellerRequest({ name, phone, restaurantId });
    await newRequest.save();

    res.status(201).json({ 
      message: 'تم إرسال طلب البائع بنجاح',
      request: newRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error });
  }
};

// عرض جميع طلبات البائعين
exports.getAllSellerRequests = async (req, res) => {
  try {
    const requests = await SellerRequest.find({ status: 'pending' })
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error });
  }
};

// موافقة الأدمن على طلب بائع
exports.approveSellerRequest = async (req, res) => {
  const { requestId } = req.body;

  try {
    // العثور على الطلب
    const request = await SellerRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    // إنشاء كلمة مرور عشوائية
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // التحقق من عدم وجود مستخدم بنفس رقم الهاتف
    const existingUser = await User.findOne({ phone: request.phone });
    if (existingUser) {
      return res.status(400).json({ message: 'يوجد مستخدم مسجل بنفس رقم الهاتف' });
    }

    // إنشاء المستخدم الجديد
    const newUser = new User({
      email: `${request.phone}@restaurant.com`, // إنشاء إيميل افتراضي
      phone: request.phone,
      password: hashedPassword,
      isSeller: true,
      managedRestaurant: request.restaurantId
    });

    await newUser.save();

    // تحديث حالة الطلب إلى "موافق عليه" وحفظ كلمة المرور
    request.status = 'approved';
    request.password = randomPassword; // حفظ كلمة المرور الغير مشفرة لعرضها للأدمن
    await request.save();

    res.status(200).json({ 
      message: 'تمت الموافقة على طلب البائع بنجاح',
      credentials: {
        phone: request.phone,
        password: randomPassword // نرسل كلمة المرور للأدمن ليعطيها للبائع
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error });
  }
};