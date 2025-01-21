const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// إعداد Multer مع Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads', // اسم المجلد اللي هتتخزن فيه الصور
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'] // الصيغ المسموح بيها
    }
});

const upload = multer({ storage: storage });

exports.createProduct = (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err });
        }

        const newProduct = new Product({
            name: req.body.name,
            quantity: req.body.quantity,
            price: req.body.price,
            image: req.file ? req.file.path : '' // حفظ رابط الصورة من Cloudinary
        });

        try {
            await newProduct.save();
            res.json(newProduct);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });
};