// controllers/offerController.js
const Offer = require('../models/offerModel');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer + Cloudinary Storage
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "offers", // Folder name on Cloudinary
//     allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
//   },
// });


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

exports.addOffer = async (req, res) => {
  try {
    const { title, subject, description } = req.body;
    const imageFile = req.file;

    if (!title || !subject || !description || !imageFile) {
      return res.status(400).json({ message: "جميع الحقول مطلوبة" });
    }

    // رفع الصورة إلى Cloudinary
    const result = await cloudinary.uploader.upload(imageFile.path, {
      folder: 'offers' // اختياري: مجلد في Cloudinary
    });

    // إنشاء العرض الجديد
    const newOffer = new Offer({
      title,
      subject,
      description,
      imageUrl: result.secure_url
    });

    await newOffer.save();
    
    res.status(201).json({
      message: 'تمت إضافة العرض بنجاح',
      offer: newOffer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'حدث خطأ في الخادم',
      error: error.message
    });
  }
};

// Add Today's Offer
// exports.addOffer = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(500).json({ message: "Image upload failed", error: err });
//     }

//     const { title, subject, description } = req.body;
//     const imageUrl = req.file ? req.file.path : null; // Get Cloudinary image URL

//     if (!title || !subject || !description || !imageUrl) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     try {
//       const newOffer = new Offer({ title, subject, description, imageUrl });
//       await newOffer.save();
//       res.status(201).json({ message: 'Offer added successfully', offer: newOffer });
//     } catch (error) {
//       res.status(500).json({ message: 'Server error', error });
//     }
//   });
// };

// Get All Offers
exports.getOffers = async (req, res) => {
  try {
    const offers = await Offer.find();
    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};




// Update Offer
exports.updateOffer = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Image upload failed", error: err });
    }

    const { id } = req.params;
    const { title, subject, description } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Get Cloudinary image URL

    try {
      const updatedData = { title, subject, description };
      if (imageUrl) updatedData.imageUrl = imageUrl; // Update imageUrl only if a new image is uploaded

      const updatedOffer = await Offer.findByIdAndUpdate(
        id,
        updatedData,
        { new: true }
      );

      if (!updatedOffer) {
        return res.status(404).json({ message: 'Offer not found' });
      }

      res.status(200).json({ message: 'Offer updated successfully', offer: updatedOffer });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });
};

// Delete Offer
exports.deleteOffer = async (req, res) => {
  const { id } = req.params;

  try {
    const offer = await Offer.findByIdAndDelete(id);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    res.status(200).json({ message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


// controllers/offerController.js

// Get a single offer by ID
exports.getOfferById = async (req, res) => {
  const { id } = req.params;

  try {
      const offer = await Offer.findById(id); 
      if (!offer) {
          return res.status(404).json({ message: 'Offer not found' });
      }
      res.status(200).json(offer); 
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
};


exports.upload = upload;