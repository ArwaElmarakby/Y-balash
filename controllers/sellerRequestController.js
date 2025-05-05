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
    const { 
      adminNotes,
      requestEmail,    // الإيميل الأصلي الموجود في الطلب (للتحقق)
      sellerEmail,     // الإيميل الجديد الذي ستحدده (يمكن أن يكون مختلفًا)
      sellerPassword   // كلمة السر الجديدة
    } = req.body;
  
    try {
      // 1. البحث عن الطلب باستخدام الإيميل الأصلي
      const request = await SellerRequest.findOne({ 
        userEmail: requestEmail,
        status: 'pending'
      });
  
      if (!request) {
        return res.status(404).json({ 
          message: 'No pending request found with this email'
        });
      }
  
      // 2. إنشاء/تحديث المستخدم كبائع (بالإيميل الجديد)
      const user = await User.findOneAndUpdate(
        { email: requestEmail }, // البحث بالإيميل الأصلي
        {
          email: sellerEmail,    // تحديث إلى الإيميل الجديد
          isSeller: true,
          managedRestaurant: request.restaurantId,
          password: sellerPassword
        },
        { new: true }
      );
  
      // 3. تحديث حالة الطلب
      request.status = 'approved';
      request.adminNotes = adminNotes;
      await request.save();
  
      // 4. إرسال الإيميل الجديد والبيانات للمسؤول
      res.status(200).json({
        message: 'Seller account activated successfully',
        seller: {
          oldEmail: requestEmail,
          newEmail: sellerEmail,
          temporaryPassword: sellerPassword
        }
      });
  
    } catch (error) {
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
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