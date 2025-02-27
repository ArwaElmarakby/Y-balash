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
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "offers", // Folder name on Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
  },
});

const upload = multer({ storage: storage }).single("image"); // Use single file upload

// Add Today's Offer
exports.addOffer = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Image upload failed", error: err });
    }

    const { title, subject, description } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Get Cloudinary image URL

    if (!title || !subject || !description || !imageUrl) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const newOffer = new Offer({ title, subject, description, imageUrl });
      await newOffer.save();
      res.status(201).json({ message: 'Offer added successfully', offer: newOffer });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });
};

// Get All Offers
exports.getOffers = async (req, res) => {
  try {
    const offers = await Offer.find();
    res.status(200).json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};