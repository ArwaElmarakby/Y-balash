const SellerRequest = require('../models/sellerRequestModel');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const nodemailer = require('nodemailer');

// إرسال طلب انضمام كبائع
exports.requestSellerAccount = async (req, res) => {
  const { userEmail, restaurantName } = req.body;

  try {
    // التحقق من وجود طلب مسبق
    const existingRequest = await SellerRequest.findOne({ userEmail });
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending request' 
      });
    }

    // إنشاء طلب جديد
    const newRequest = new SellerRequest({
      userEmail,
      restaurantName,
      status: 'pending'
    });

    await newRequest.save();

    // إرسال إيميل للمسؤول
    await sendRequestToAdmin(userEmail, restaurantName);

    res.status(201).json({ 
      message: 'Seller request submitted successfully', 
      request: newRequest 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// الحصول على جميع الطلبات (للمسؤولين)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await SellerRequest.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// الموافقة على طلب بائع (للمسؤولين)
exports.approveRequest = async (req, res) => {
  const { requestId } = req.params;
  const { adminNotes } = req.body;

  try {
    const request = await SellerRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // إنشاء مطعم جديد
    const newRestaurant = new Restaurant({
      name: request.restaurantName,
      imageUrl: 'default-restaurant-image.jpg', // يمكنك تغيير هذا لاحقاً
      description: 'New restaurant',
      location: 'To be updated'
    });

    await newRestaurant.save();

    // تحديث المستخدم ليكون بائعاً
    const user = await User.findOneAndUpdate(
      { email: request.userEmail },
      { 
        isSeller: true,
        managedRestaurant: newRestaurant._id 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // تحديث حالة الطلب
    request.status = 'approved';
    request.adminNotes = adminNotes;
    request.processedAt = new Date();
    await request.save();

    // إرسال إيميل للمستخدم بالموافقة
    await sendApprovalEmail(request.userEmail, newRestaurant.name);

    res.status(200).json({ 
      message: 'Request approved successfully',
      user,
      restaurant: newRestaurant
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// رفض طلب بائع (للمسؤولين)
exports.rejectRequest = async (req, res) => {
  const { requestId } = req.params;
  const { adminNotes } = req.body;

  try {
    const request = await SellerRequest.findByIdAndUpdate(
      requestId,
      { 
        status: 'rejected',
        adminNotes,
        processedAt: new Date() 
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // إرسال إيميل للمستخدم بالرفض
    await sendRejectionEmail(request.userEmail, adminNotes);

    res.status(200).json({ 
      message: 'Request rejected successfully',
      request
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// وظائف مساعدة لإرسال البريد الإلكتروني
async function sendRequestToAdmin(userEmail, restaurantName) {
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
    html: `
      <h1>New Seller Request</h1>
      <p>User with email: ${userEmail} has requested to become a seller.</p>
      <p>Restaurant Name: ${restaurantName}</p>
      <p>Please review this request in the admin panel.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendApprovalEmail(userEmail, restaurantName) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: userEmail,
    subject: 'Your Seller Account Has Been Approved',
    html: `
      <h1>Congratulations!</h1>
      <p>Your request to become a seller has been approved.</p>
      <p>Restaurant Name: ${restaurantName}</p>
      <p>You can now login to your seller account using your email and the following temporary password:</p>
      <p><strong>Temporary Password: Seller@123</strong></p>
      <p>Please change your password after logging in.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendRejectionEmail(userEmail, adminNotes) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: userEmail,
    subject: 'Your Seller Account Request',
    html: `
      <h1>Seller Request Update</h1>
      <p>We regret to inform you that your request to become a seller has been rejected.</p>
      <p>Reason: ${adminNotes || 'Not specified'}</p>
      <p>If you have any questions, please contact our support team.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}