const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// إعداد Multer لاستخدام Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "restaurants",  // يمكن تغيير اسم المجلد هنا في Cloudinary
    allowedFormats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
