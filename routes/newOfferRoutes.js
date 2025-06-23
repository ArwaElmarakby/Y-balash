const express = require('express');
const router = express.Router();
const { addNewOffer } = require('../controllers/newOfferController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../services/uploadService'); // سأشرح هذا لاحقًا

// المسار الجديد لإضافة عرض
router.post('/add-new', 
  authMiddleware, 
  adminMiddleware, 
  upload.single('image'), 
  addNewOffer
);

module.exports = router;