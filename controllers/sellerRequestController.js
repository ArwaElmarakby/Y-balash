// controllers/sellerRequestController.js
const SellerRequest = require('../models/sellerRequestModel');
const nodemailer = require('nodemailer');
const User = require('../models/userModel');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});


exports.requestSellerAccount = async (req, res) => {
  const { email } = req.body;

  try {

    const existingRequest = await SellerRequest.findOne({ email });
    if (existingRequest) {
      return res.status(400).json({ message: 'Request already exists for this email' });
    }


    const newRequest = new SellerRequest({ email });
    await newRequest.save();


    const mailOptions = {
      from: process.env.EMAIL,
      to: 'yabalash001@gmail.com',
      subject: 'New Seller Registration Request',
      html: `
        <p>A new seller has requested access:</p>
        <p>Email: ${email}</p>
        <p>Please review and approve/reject this request.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Request submitted successfully. Admin will review your application.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.approveSellerRequest = async (req, res) => {
  const { requestId } = req.params;
  const { username, password } = req.body;

  try {
    const request = await SellerRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }


    let user = await User.findOne({ email: request.email });

    if (!user) {
      user = new User({
        email: request.email,
        password,
        isSeller: true
      });
    } else {
      user.isSeller = true;
      user.password = password;
    }

    await user.save();


    request.status = 'approved';
    request.approvedAt = new Date();
    request.credentials = { username, password };
    await request.save();


    const mailOptions = {
      from: process.env.EMAIL,
      to: request.email,
      subject: 'Your Seller Account Has Been Approved',
      html: `
        <p>Your seller account has been approved!</p>
        <p>Here are your login credentials:</p>
        <p>Username: ${username}</p>
        <p>Password: ${password}</p>
        <p>You can now login to the seller dashboard.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Seller request approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.rejectSellerRequest = async (req, res) => {
  const { requestId } = req.params;
  const { reason } = req.body;

  try {
    const request = await SellerRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'rejected';
    request.adminNotes = reason;
    await request.save();


    const mailOptions = {
      from: process.env.EMAIL,
      to: request.email,
      subject: 'Your Seller Account Request',
      html: `
        <p>We regret to inform you that your seller account request has been rejected.</p>
        <p>Reason: ${reason}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Seller request rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.getAllSellerRequests = async (req, res) => {
  try {
    const requests = await SellerRequest.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};