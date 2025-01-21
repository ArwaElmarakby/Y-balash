const multer = require('multer');
const path = require('path');

// إعداد multer لتخزين الملفات مؤقتًا
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../temp')); // مجلد مؤقت لحفظ الملفات
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // اسم الملف
  },
});

const upload = multer({ storage: storage });

module.exports = upload;