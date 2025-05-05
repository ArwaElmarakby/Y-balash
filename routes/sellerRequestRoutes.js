const express = require('express');
const router = express.Router();
const SellerRequest = require('../models/sellerRequestModel');
const { authMiddleware } = require('./authRoutes');
const nodemailer = require('nodemailer');

// إرسال طلب بائع جديد
router.post('/request-seller', authMiddleware, async (req, res) => {
  const { email, restaurantName } = req.body;
  const userId = req.user._id;

  try {
    // التحقق من وجود طلب مسبق
    const existingRequest = await SellerRequest.findOne({ email });
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'There is already a pending request with this email' 
      });
    }

    // إنشاء طلب جديد
    const newRequest = new SellerRequest({
      email,
      restaurantName
    });

    await newRequest.save();

    // إرسال البريد الإلكتروني إلى المسؤول
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Seller Request',
      text: `New seller request received:
      
      Email: ${email}
      Restaurant Name: ${restaurantName}
      
      Please review this request in the admin panel.`
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ 
      message: 'Seller request submitted successfully. You will receive an email once your request is processed.',
      request: newRequest
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error submitting seller request',
      error: error.message 
    });
  }
});

module.exports = router;