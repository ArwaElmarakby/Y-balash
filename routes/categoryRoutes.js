const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Category = require('../models/categoryModel');
const { addCategory, getCategories, deleteCategory, updateCategory, searchCategories  } = require('../controllers/categoryController');

//  Multer Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'categories', // folder Cloudinary
      allowedFormats: ['jpg', 'jpeg', 'png'],
    },
  });


const upload = multer({ storage: storage });


router.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'upload photo' });
    }

    try {
        const category = await Category.create({
            name: req.body.name,
            imageUrl: req.file.path,

   });

    res.status(200).json({
      message: 'The category image has been uploaded successfully',
      category: category,
    });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while uploading the category image', error });
  }
});



router.post('/add', addCategory); 
router.get('/all', getCategories); 
router.delete('/delete/:id', deleteCategory); 
router.put('/update/:id', updateCategory); 
router.get('/search', searchCategories);

module.exports = router;