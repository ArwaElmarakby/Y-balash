
// const express = require('express');
// const bodyParser = require('body-parser');
// const connectDB = require('./config/db');
// const authRoutes = require('./routes/authRoutes');
// require('dotenv').config(); 


// const app = express();

// app.get('/', (req, res) => {
//     res.send('Server is running!');
// });


// // Middleware
// app.use(bodyParser.json());

// // Routes
// app.use('/api/auth', authRoutes); 

// // Connect to MongoDB
// connectDB();

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));















// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const session = require('express-session');
// const passport = require('passport');
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const connectDB = require('./config/db');
// const authRoutes = require('./routes/authRoutes'); // Custom routes

// // Initialize app
// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(bodyParser.json());
// app.use(session({
//     secret: "secret",
//     resave: false,
//     saveUninitialized: true,
// }));
// app.use(passport.initialize());
// app.use(passport.session());

// // Passport Google Strategy
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:5000/auth/google/callback",
// }, (accessToken, refreshToken, profile, done) => {
//     // You can save user profile to database here
//     return done(null, profile);
// }));

// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((user, done) => done(null, user));

// // Routes
// app.get("/", (req, res) => {
//     res.send("<a href='/auth/google'>Login with Google</a>");
// });

// app.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));

// app.get("/auth/google/callback", passport.authenticate('google', {failureRedirect: "/"}), (req, res) => {
//     res.redirect('/profile');
// });

// app.get("/profile", (req, res) => {
//     if (!req.user) {
//         return res.redirect('/');
//     }
//     res.send(`Welcome ${req.user.displayName}`);
// });

// app.get("/logout", (req, res) => {
//     req.logout(() => {
//         res.redirect("/");
//     });
// });

// // Custom API routes
// app.use('/api/auth', authRoutes);

// // Fallback route
// app.get('*', (req, res) => {
//     res.status(404).send('Page not found');
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


















// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const session = require('express-session');
// const passport = require('passport');
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const connectDB = require('./config/db');
// const authRoutes = require('./routes/authRoutes'); // Custom routes
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');

// // Initialize app
// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(bodyParser.json());
// app.use(session({
//     secret: "secret",
//     resave: false,
//     saveUninitialized: true,
// }));
// app.use(passport.initialize());
// app.use(passport.session());

// // Email Transporter Configuration
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// // Temporary storage for OTPs (use a database for production)
// let otpStorage = {};

// // Passport Google Strategy
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:5000/auth/google/callback",
// }, (accessToken, refreshToken, profile, done) => {
//     // You can save user profile to database here
//     return done(null, profile);
// }));

// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((user, done) => done(null, user));

// // Routes
// app.get("/", (req, res) => {
//     res.send("<a href='/auth/google'>Login with Google</a>");
// });

// app.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));

// app.get("/auth/google/callback", passport.authenticate('google', {failureRedirect: "/"}), (req, res) => {
//     res.redirect('/profile');
// });

// app.get("/profile", (req, res) => {
//     if (!req.user) {
//         return res.redirect('/');
//     }
//     res.send(`Welcome ${req.user.displayName}`);
// });

// app.get("/logout", (req, res) => {
//     req.logout(() => {
//         res.redirect("/");
//     });
// });

// // Custom API routes for OTP
// app.post('/send-otp', (req, res) => {
//   const { email } = req.body;
//   if (!email) {
//     return res.status(400).json({ message: 'Email is required' });
//   }

//   // Generate OTP
//   const otp = crypto.randomInt(100000, 999999).toString();

//   // Store OTP in memory (associate with email)
//   otpStorage[email] = otp;

//   // Send Email
//   transporter.sendMail({
//     from: `"Verification Service" <${process.env.EMAIL}>`,
//     to: email,
//     subject: 'Your OTP Code',
//     text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
//   })
//     .then(() => res.status(200).json({ message: 'OTP sent successfully' }))
//     .catch((error) => res.status(500).json({ message: 'Error sending email', error }));
// });

// app.post('/verify-otp', (req, res) => {
//   const { email, otp } = req.body;

//   if (!email || !otp) {
//     return res.status(400).json({ message: 'Email and OTP are required' });
//   }

//   // Validate OTP
//   if (otpStorage[email] === otp) {
//     // OTP is correct
//     delete otpStorage[email]; // Remove used OTP
//     return res.status(200).json({ message: 'Email verified successfully' });
//   }

//   return res.status(400).json({ message: 'Invalid OTP' });
// });

// // Custom API routes
// app.use('/api/auth', authRoutes);

// // Fallback route
// app.get('*', (req, res) => {
//     res.status(404).send('Page not found');
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));















// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const session = require('express-session');
// const passport = require('passport');
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const connectDB = require('./config/db');
// const authRoutes = require('./routes/authRoutes'); // Custom routes
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');

// // Initialize app
// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(bodyParser.json());
// app.use(session({
//     secret: "secret",
//     resave: false,
//     saveUninitialized: true,
// }));
// app.use(passport.initialize());
// app.use(passport.session());

// // Email Transporter Configuration
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// // Temporary storage for OTPs (use a database for production)
// let otpStorage = {};

// // Passport Google Strategy
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:5000/auth/google/callback",
// }, (accessToken, refreshToken, profile, done) => {
//     // You can save user profile to database here
//     return done(null, profile);
// }));

// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((user, done) => done(null, user));

// // Routes
// app.get("/", (req, res) => {
//     res.send("<a href='/auth/google'>Login with Google</a>");
// });

// app.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));

// app.get("/auth/google/callback", passport.authenticate('google', {failureRedirect: "/"}), (req, res) => {
//     res.redirect('/profile');
// });

// app.get("/profile", (req, res) => {
//     if (!req.user) {
//         return res.redirect('/');
//     }
//     res.send(`Welcome ${req.user.displayName}`);
// });

// app.get("/logout", (req, res) => {
//     req.logout(() => {
//         res.redirect("/");
//     });
// });

// let generatedOTP; 
// let userEmail; 


// app.post("/send-otp", async (req, res) => {
//   userEmail = req.body.email;

//   if (!userEmail) {
//     return res.status(400).json({ message: "Please enter your email" });
//   }

//   generatedOTP = Math.floor(100000 + Math.random() * 900000); // توليد OTP عشوائي

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL,
//     to: userEmail,
//     subject: "OTP Code",
//     text: `Your OTP Code is: ${generatedOTP}`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: "OTP sent to your email" });
//   } catch (error) {
//     res.status(500).json({ message: "An error occurred while sending OTP", error });
//   }
// });


// app.post("/verify-otp", (req, res) => {
//   const { otp } = req.body;

//   if (!otp) {
//     return res.status(400).json({ message: "Please enter OTP" });
//   }

//   if (parseInt(otp) === generatedOTP) {
//     res.status(200).json({ message: "OTP verified successfully" });
//   } else {
//     res.status(400).json({ message: "Incorrect OTP" });
//   }
// });


// // Custom API routes
// app.use('/api/auth', authRoutes);

// // Fallback route
// app.get('*', (req, res) => {
//     res.status(404).send('Page not found');
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));






























// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const session = require('express-session');
// const passport = require('passport');
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const connectDB = require('./config/db');
// const authRoutes = require('./routes/authRoutes'); // Custom routes
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');

// // Initialize app
// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(bodyParser.json());
// app.use(session({
//     secret: "secret",
//     resave: false,
//     saveUninitialized: true,
// }));
// app.use(passport.initialize());
// app.use(passport.session());

// // Email Transporter Configuration
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// // Temporary storage for OTPs (use a database for production)
// let otpStorage = {};

// // Passport Google Strategy
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:5000/auth/google/callback",
// }, (accessToken, refreshToken, profile, done) => {
//     // You can save user profile to database here
//     return done(null, profile);
// }));

// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((user, done) => done(null, user));

// // Routes
// app.get("/", (req, res) => {
//     res.send("<a href='/auth/google'>Login with Google</a>");
// });

// app.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));

// app.get("/auth/google/callback", passport.authenticate('google', {failureRedirect: "/"}), (req, res) => {
//     res.redirect('/profile');
// });

// app.get("/profile", (req, res) => {
//     if (!req.user) {
//         return res.redirect('/');
//     }
//     res.send(`Welcome ${req.user.displayName}`);
// });

// app.get("/logout", (req, res) => {
//     req.logout(() => {
//         res.redirect("/");
//     });
// });

// let generatedOTP; 
// let userEmail; 


// app.post("/send-otp", async (req, res) => {
//   userEmail = req.body.email;

//   if (!userEmail) {
//     return res.status(400).json({ message: "Please enter your email" });
//   }

//   generatedOTP = Math.floor(100000 + Math.random() * 900000); // توليد OTP عشوائي

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL,
//     to: userEmail,
//     subject: "OTP Code",
//     text: `Your OTP Code is: ${generatedOTP}`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: "OTP sent to your email" });
//   } catch (error) {
//     res.status(500).json({ message: "An error occurred while sending OTP", error });
//   }
// });


// app.post("/verify-otp", (req, res) => {
//   const { otp } = req.body;

//   if (!otp) {
//     return res.status(400).json({ message: "Please enter OTP" });
//   }

//   if (parseInt(otp) === generatedOTP) {
//     res.status(200).json({ message: "OTP verified successfully" });
//   } else {
//     res.status(400).json({ message: "Incorrect OTP" });
//   }
// });


// // Custom API routes
// app.use('/api/auth', authRoutes);




// // Fallback route
// app.get('*', (req, res) => {
//     res.status(404).send('Page not found');
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


















// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const session = require('express-session');
// const passport = require('passport');
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const connectDB = require('./config/db');
// const authRoutes = require('./routes/authRoutes'); // Custom routes
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');
// const User = require('./models/userModel');


// // Initialize app
// const app = express();

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(bodyParser.json());
// app.use(session({
//     secret: "secret",
//     resave: false,
//     saveUninitialized: true,
// }));
// app.use(passport.initialize());
// app.use(passport.session());

// // Email Transporter Configuration
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// // Temporary storage for OTPs (use a database for production)
// let otpStorage = {};

// // Passport Google Strategy
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:5000/auth/google/callback",
// }, (accessToken, refreshToken, profile, done) => {
//     // You can save user profile to database here
//     return done(null, profile);
// }));

// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((user, done) => done(null, user));

// // Routes
// app.get("/", (req, res) => {
//     res.send("<a href='/auth/google'>Login with Google</a>");
// });

// app.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));

// app.get("/auth/google/callback", passport.authenticate('google', {failureRedirect: "/"}), (req, res) => {
//     res.redirect('/profile');
// });

// app.get("/profile", (req, res) => {
//     if (!req.user) {
//         return res.redirect('/');
//     }
//     res.send(`Welcome ${req.user.displayName}`);
// });

// app.get("/logout", (req, res) => {
//     req.logout(() => {
//         res.redirect("/");
//     });
// });

// let generatedOTP; 
// let userEmail; 


// app.post("/send-otp", async (req, res) => {
//   userEmail = req.body.email;

//   if (!userEmail) {
//     return res.status(400).json({ message: "Please enter your email" });
//   }

//   generatedOTP = Math.floor(100000 + Math.random() * 900000); 

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL,
//     to: userEmail,
//     subject: "OTP Code",
//     text: `Your OTP Code is: ${generatedOTP}`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: "OTP sent to your email" });
//   } catch (error) {
//     res.status(500).json({ message: "An error occurred while sending OTP", error });
//   }
// });


// app.post("/verify-otp", (req, res) => {
//   const { otp } = req.body;

//   if (!otp) {
//     return res.status(400).json({ message: "Please enter OTP" });
//   }

//   if (parseInt(otp) === generatedOTP) {
//     res.status(200).json({ message: "OTP verified successfully" });
//   } else {
//     res.status(400).json({ message: "Incorrect OTP" });
//   }
// });


// // Custom API routes
// app.use('/api/auth', authRoutes);






// app.post("/reset-password", async (req, res) => {
//   const { newPassword, confirmNewPassword } = req.body;

  
//   if (!newPassword || !confirmNewPassword) {
//     return res.status(400).json({ message: "Both fields are required" });
//   }

//   if (newPassword !== confirmNewPassword) {
//     return res.status(400).json({ message: "Passwords do not match" });
//   }

//   if (!userEmail || !generatedOTP) {
//     return res.status(400).json({ message: "OTP verification required before resetting password" });
//   }

//   try {
    
//     const user = await User.findOne({ email: userEmail });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

    
//     user.password = newPassword;
//     await user.save();

    
//     generatedOTP = null;
//     userEmail = null;

//     res.status(200).json({ message: "Password updated successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "An error occurred while resetting the password" });
//   }
// });





// // Fallback route
// app.get('*', (req, res) => {
//     res.status(404).send('Page not found');
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));










































require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes').router;  // Custom routes
const userRoutes = require('./routes/userRoutes');
const imageRoutes = require('./routes/imageRoutes'); // Import the new routes
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('./models/userModel');
const cors = require('cors');
const restaurantRoutes = require('./routes/restaurantRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes'); 
const favoriteRoutes = require('./routes/favoriteRoutes'); 
const offerRoutes = require('./routes/offerRoutes'); 
const deliveryRoutes = require('./routes/deliveryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const locationRoutes = require('./routes/locationRoutes');
const couponRoutes = require('./routes/couponRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { getTotalCategories } = require('./controllers/categoryController');
const { getTotalRestaurants } = require('./controllers/restaurantController');
const pointsRoutes = require('./routes/pointsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const clientAddressRoutes = require('./routes/clientAddressRoutes');
const clientInfoRoutes = require('./routes/clientInfoRoutes');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');



// Initialize app
const app = express();

// Connect to MongoDB
connectDB();

//  Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


//  Multer  Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", 
    allowedFormats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage: storage });

// Endpoint 
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "upload photo" });
  }

  res.status(200).json({
    message: "The image has been uploaded successfully",
    imageUrl: req.file.path, 
  });
});


// Middleware
app.use(bodyParser.json());
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Email Transporter Configuration
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Temporary storage for OTPs (use a database for production)
let otpStorage = {};

// Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://y-balash.vercel.app/auth/google/callback",
}, (accessToken, refreshToken, profile, done) => {
    // You can save user profile to database here
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes
app.get("/", (req, res) => {
    res.send("<a href='/auth/google'>Login with Google</a>");
});

app.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));

app.get("/auth/google/callback", passport.authenticate('google', {failureRedirect: "/"}), (req, res) => {
    res.redirect('/profile');
});

app.get("/profile", (req, res) => {
    if (!req.user) {
        return res.redirect('/');
    }
    res.send(`Welcome ${req.user.displayName}`);
});

app.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
});

let generatedOTP; 
let userEmail; 


app.post("/send-otp", async (req, res) => {
  userEmail = req.body.email;

  if (!userEmail) {
    return res.status(400).json({ message: "Please enter your email" });
  }

  generatedOTP = Math.floor(100000 + Math.random() * 900000); 

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: userEmail,
    subject: "OTP Code",
    text: `Your OTP Code is: ${generatedOTP}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred while sending OTP", error });
  }
});


app.post("/verify-otp", (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: "Please enter OTP" });
  }

  if (parseInt(otp) === generatedOTP) {
    res.status(200).json({ message: "OTP verified successfully" });
  } else {
    res.status(400).json({ message: "Incorrect OTP" });
  }
});

app.post("/api/request-seller", async (req, res) => {
  const { email, message, phone } = req.body; 

  if (!email) {
    return res.status(400).json({ 
      success: false,
      message: "Email is required" 
    });
  }

  try {

    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.ADMIN_EMAIL || "yabalash001@gmail.com",
      subject: "New Seller Request",
      text: `New seller request from ${email}.\nPhone: ${phone || 'Not provided'}\n\nMessage: ${message || 'No additional message'}`,
      html: `
        <h1>New Seller Request</h1>
        <p>Email: <strong>${email}</strong></p>
        <p>Phone: <strong>${phone || 'Not provided'}</strong></p>
        ${message ? `<p>Message: ${message}</p>` : ''}
      `
    };

    await transporter.sendMail(mailOptions);


    const userMailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your Seller Request Received",
      text: `Thank you for your interest! We've received your request to become a seller and will contact you soon.`,
      html: `
        <h1>Request Received</h1>
        <p>We'll review your request and get back to you shortly.</p>
      `
    };

    await transporter.sendMail(userMailOptions);

    res.status(200).json({ 
      success: true,
      message: "Seller request submitted successfully" 
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to process request",
      error: error.message 
    });
  }
});

// Custom API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/images', imageRoutes); 
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes); 
app.use('/api/favorites', favoriteRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/purchases', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/location', locationRoutes); 
app.use('/api', statsRoutes);
app.get('/api/total-categories', getTotalCategories);
app.get('/api/total-restaurants', getTotalRestaurants);
app.use('/api/points', pointsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', sellerRoutes);
app.use('/api', sellerRoutes); 
app.use('/api/addresses', clientAddressRoutes);
app.use('/api/client-info', clientInfoRoutes);





app.post("/reset-password", async (req, res) => {
  const { newPassword, confirmNewPassword } = req.body;

  
  if (!newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: "Both fields are required" });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (!userEmail || !generatedOTP) {
    return res.status(400).json({ message: "OTP verification required before resetting password" });
  }

  try {
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    
    user.password = newPassword;
    await user.save();

    
    generatedOTP = null;
    userEmail = null;

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while resetting the password" });
  }
});

// add origin
app.use(cors());




// Fallback route
app.get('*', (req, res) => {
    res.status(404).send('Page not found');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



// // arwaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa































// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const session = require('express-session');
// const passport = require('passport');
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const connectDB = require('./config/db');
// const authRoutes = require('./routes/authRoutes').router;
// const imageRoutes = require('./routes/imageRoutes');
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');
// const User = require('./models/userModel');
// const cors = require('cors');
// const restaurantRoutes = require('./routes/restaurantRoutes');
// const categoryRoutes = require('./routes/categoryRoutes');
// const cartRoutes = require('./routes/cartRoutes');
// const favoriteRoutes = require('./routes/favoriteRoutes');
// const offerRoutes = require('./routes/offerRoutes');
// const deliveryRoutes = require('./routes/deliveryRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
// const locationRoutes = require('./routes/locationRoutes');
// const couponRoutes = require('./routes/couponRoutes');
// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// const app = express();

// connectDB();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "uploads",
//     allowedFormats: ["jpg", "jpeg", "png"],
//   },
// });

// const upload = multer({ storage: storage });

// app.post("/upload", upload.single("image"), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "upload photo" });
//   }

//   res.status(200).json({
//     message: "The image has been uploaded successfully",
//     imageUrl: req.file.path,
//   });
// });

// app.use(bodyParser.json());
// app.use(session({
//     secret: "secret",
//     resave: false,
//     saveUninitialized: true,
// }));
// app.use(passport.initialize());
// app.use(passport.session());

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// let otpStorage = {};

// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "https://y-balash.vercel.app/auth/google/callback",
// }, (accessToken, refreshToken, profile, done) => {
//     return done(null, profile);
// }));

// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((user, done) => done(null, user));

// app.get("/", (req, res) => {
//     res.send("<a href='/auth/google'>Login with Google</a>");
// });

// app.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));

// app.get("/auth/google/callback", passport.authenticate('google', {failureRedirect: "/"}), (req, res) => {
//     res.redirect('/profile');
// });

// app.get("/profile", (req, res) => {
//     if (!req.user) {
//         return res.redirect('/');
//     }
//     res.send(`Welcome ${req.user.displayName}`);
// });

// app.get("/logout", (req, res) => {
//     req.logout(() => {
//         res.redirect("/");
//     });
// });

// let generatedOTP;
// let userEmail;

// app.post("/send-otp", async (req, res) => {
//   userEmail = req.body.email;

//   if (!userEmail) {
//     return res.status(400).json({ message: "Please enter your email" });
//   }

//   generatedOTP = Math.floor(100000 + Math.random() * 900000);

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL,
//     to: userEmail,
//     subject: "OTP Code",
//     text: `Your OTP Code is: ${generatedOTP}`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: "OTP sent to your email" });
//   } catch (error) {
//     res.status(500).json({ message: "An error occurred while sending OTP", error });
//   }
// });

// app.post("/verify-otp", (req, res) => {
//   const { otp } = req.body;

//   if (!otp) {
//     return res.status(400).json({ message: "Please enter OTP" });
//   }

//   if (parseInt(otp) === generatedOTP) {
//     res.status(200).json({ message: "OTP verified successfully" });
//   } else {
//     res.status(400).json({ message: "Incorrect OTP" });
//   }
// });

// app.use('/api/auth', authRoutes);
// app.use('/api/images', imageRoutes);
// app.use('/api/restaurants', restaurantRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/cart', cartRoutes);
// app.use('/api/favorites', favoriteRoutes);
// app.use('/api/offers', offerRoutes);
// app.use('/api/delivery', deliveryRoutes);
// app.use('/api/purchases', paymentRoutes);
// app.use('/api/coupons', couponRoutes);
// app.use('/api/location', locationRoutes);

// app.post("/reset-password", async (req, res) => {
//   const { newPassword, confirmNewPassword } = req.body;

//   if (!newPassword || !confirmNewPassword) {
//     return res.status(400).json({ message: "Both fields are required" });
//   }

//   if (newPassword !== confirmNewPassword) {
//     return res.status(400).json({ message: "Passwords do not match" });
//   }

//   if (!userEmail || !generatedOTP) {
//     return res.status(400).json({ message: "OTP verification required before resetting password" });
//   }

//   try {
//     const user = await User.findOne({ email: userEmail });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     user.password = newPassword;
//     await user.save();

//     generatedOTP = null;
//     userEmail = null;

//     res.status(200).json({ message: "Password updated successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "An error occurred while resetting the password" });
//   }
// });

// app.use(cors());

// app.get('*', (req, res) => {
//     res.status(404).send('Page not found');
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));