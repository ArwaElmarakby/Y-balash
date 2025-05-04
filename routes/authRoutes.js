
// const express = require('express');
// const { signUp, login } = require('../controllers/authController');
// const { sendOtp, verifyOtp } = require('../controllers/otpController');

// const router = express.Router();

// router.post('/signup', signUp); 
// router.post('/login', login);
// router.post('/send-otp', sendOtp);
// router.post('/verify-otp', verifyOtp);

// module.exports = router;






// const express = require('express');
// const { signUp, login } = require('../controllers/authController');
// const { sendOtp, verifyOtp } = require('../controllers/otpController');
// const { changePassword } = require('../controllers/authController');

// const router = express.Router();

// router.post('/signup', signUp); 
// router.post('/login', login);
// router.post('/send-otp', sendOtp);
// router.post('/verify-otp', verifyOtp);
// router.post('/change-password', changePassword);


// module.exports = router;











// const express = require('express');
// const router = express.Router();
// const { signUp, login, changePassword } = require('../controllers/authController');
// const jwt = require('jsonwebtoken');
// const User = require('../models/userModel'); 


// const authMiddleware = async (req, res, next) => {
//     const token = req.header('Authorization')?.replace('Bearer ', '');

//     if (!token) {
//         return res.status(401).json({ message: 'No token, authorization denied' });
//     }

//     try {

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);


//         const user = await User.findById(decoded.id);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }


//         req.user = user;
//         next();
//     } catch (error) {
//         res.status(401).json({ message: 'Token is not valid' });
//     }
// };


// router.post('/signup', signUp); 
// router.post('/login', login); 
// router.post('/change-password', changePassword); 


// router.get('/home', authMiddleware, (req, res) => {
//     res.send(`Hi ${req.user.email}`); 
// });


// module.exports = router;


























const express = require('express');
const router = express.Router();
const { signUp, login, changePassword, sellerLogin, createSellerAccount } = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); 
const { authMiddleware } = require('./authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const sellerMiddleware = require('../middleware/sellerMiddleware');


const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};


router.post('/signup', signUp); 
router.post('/login', login); 
router.post('/change-password', changePassword); 
router.post('/seller/login', sellerLogin);
router.post('/admin/create-seller', authMiddleware, adminMiddleware, createSellerAccount);


router.get('/verify', authMiddleware, (req, res) => {
    res.status(200).json({
        isAuthenticated: true,
        user: {
            id: req.user._id,
            email: req.user.email,
            isAdmin: req.user.isAdmin,
            isSeller: req.user.isSeller
        }
    });
});

router.get('/home', authMiddleware, (req, res) => {
    res.send(`Hi ${req.user.email}`); 
});


module.exports = { router, authMiddleware };