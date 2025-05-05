const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const nodemailer = require('nodemailer');

// إرسال طلب بائع
exports.requestToBecomeSeller = async (req, res) => {
  const { userId, restaurantName } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.sellerRequests.push({ restaurantName });
    await user.save();

    // إرسال إيميل إلى المسؤول
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.ADMIN_EMAIL, // إيميل المسؤول
      subject: 'New Seller Request',
      text: `User ${user.email} has requested to become a seller for restaurant: ${restaurantName}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// عرض جميع الطلبات (للمسؤول)
exports.getAllSellerRequests = async (req, res) => {
  try {
    const requests = await User.find({ 'sellerRequests.0': { $exists: true } })
      .select('email sellerRequests');

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// الموافقة على طلب بائع (للمسؤول)
exports.approveSellerRequest = async (req, res) => {
  const { userId, requestId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const request = user.sellerRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // إنشاء كلمة سر عشوائية
    const randomPassword = Math.random().toString(36).slice(-8);

    // تحديث حالة الطلب
    request.status = 'approved';
    user.isSeller = true;
    user.password = randomPassword; // سيتم تشفيرها تلقائياً بسبب middleware

    await user.save();

    // إرسال الإيميل بالمعلومات للبائع
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: 'Your Seller Account Approval',
      text: `Your request to become a seller has been approved.\n\nLogin details:\nEmail: ${user.email}\nPassword: ${randomPassword}\n\nPlease change your password after first login.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Request approved and credentials sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};