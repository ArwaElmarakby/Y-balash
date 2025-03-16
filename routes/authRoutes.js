
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
const { signUp, login, changePassword } = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); 
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');



// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer + Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'users', // مجلد لتخزين صور المستخدمين
        allowed_formats: ['jpg', 'jpeg', 'png'], // الصيغ المسموحة
    },
});

const upload = multer({ storage: storage });



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


router.get('/home', authMiddleware, (req, res) => {
    res.send(`Hi ${req.user.email}`); 
});




// New routes for user profile
router.get('/profile', authMiddleware, (req, res) => {
    const { email, gender, birthday, phone, imageUrl } = req.user;
    const username = email.split('@')[0]; // Extract username from email

    res.status(200).json({
        username,
        email,
        gender: gender || 'Not specified',
        birthday: birthday || 'Not specified',
        phone: phone || 'Not specified',
        imageUrl: imageUrl || 'No image'
    });
});

router.put('/profile/update', authMiddleware, async (req, res) => {
    const { gender, birthday, phone } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (gender) user.gender = gender;
        if (birthday) user.birthday = birthday;
        if (phone) user.phone = phone;
        if (imageUrl) user.imageUrl = imageUrl;

        await user.save();

        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


module.exports = { router, authMiddleware };