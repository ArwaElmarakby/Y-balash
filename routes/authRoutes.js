
// const express = require('express');
// const { signUp, login } = require('../controllers/authController');
// const { sendOtp, verifyOtp } = require('../controllers/otpController');

// const router = express.Router();

// router.post('/signup', signUp); 
// router.post('/login', login);
// router.post('/send-otp', sendOtp);
// router.post('/verify-otp', verifyOtp);

// module.exports = router;






const express = require('express');
const { signUp, login } = require('../controllers/authController');
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const { changePassword } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signUp); 
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/change-password', changePassword);


module.exports = router;