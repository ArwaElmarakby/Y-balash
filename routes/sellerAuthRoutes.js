const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { sendAdminApprovalEmail } = require('../services/emailService');
const { authMiddleware } = require('./authRoutes');


router.post('/request-seller-account', async (req, res) => {
  const { email, phone, password } = req.body;

  try {

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }


    user = new User({
      email,
      phone,
      password,
      isSeller: true,
      isApproved: false,
      requestedAt: new Date()
    });

    await user.save();


    await sendAdminApprovalEmail(email);

    res.status(201).json({ 
      message: 'Seller account requested. Waiting for admin approval.',
      userId: user._id 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


router.post('/seller-login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }


    if (!user.isApproved || !user.isSeller) {
      return res.status(403).json({ 
        message: 'Account not approved yet or not a seller' 
      });
    }


    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '30d' 
    });

    res.status(200).json({ 
      token,
      user: {
        id: user._id,
        email: user.email,
        isSeller: user.isSeller,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;