const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL, // yabalash001@gmail.com
    pass: process.env.ADMIN_EMAIL_PASSWORD
  }
});

exports.sendAdminApprovalEmail = async (sellerEmail) => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL, // يرسل لنفسه (المسؤول)
    subject: 'New Seller Approval Request',
    html: `
      <h1>New Seller Request</h1>
      <p>A new seller has requested access:</p>
      <p>Email: ${sellerEmail}</p>
      <p>Please login to the admin dashboard to approve or reject this request.</p>
      <a href="${process.env.ADMIN_DASHBOARD_URL}">Go to Admin Dashboard</a>
    `
  };

  await transporter.sendMail(mailOptions);
};

exports.sendSellerCredentials = async (email, username, password) => {
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: email,
    subject: 'Your Seller Account Credentials',
    html: `
      <h1>Your Seller Account Has Been Approved</h1>
      <p>Here are your login credentials:</p>
      <p>Username: ${username}</p>
      <p>Password: ${password}</p>
      <p>Please login at: <a href="${process.env.SELLER_LOGIN_URL}">Seller Login</a></p>
      <p>It's recommended to change your password after first login.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};