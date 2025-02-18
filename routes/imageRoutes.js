// routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); 
const Image = require('../models/imageModel');
const { addImage, getImages, deleteImage, updateImage, searchImage, incrementViews, getBestSelling } = require('../controllers/imageController');



//  Multer  Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'images', //  Cloudinary
      allowedFormats: ['jpg', 'jpeg', 'png'],
    },
  });
  const upload = multer({ storage: storage });


  router.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'upload photo' });
    }

    try {

        const image = await Image.create({
            name: req.body.name,
            imageUrl: req.file.path,
        });

        res.status(200).json({
          message: 'The item image has been uploaded successfully',
          image: image,
        });
      } catch (error) {
        res.status(500).json({ message: 'An error occurred while uploading the Item image', error });
      }
    });



router.post('/add', addImage);
router.get('/all', getImages);
router.delete('/delete/:id', deleteImage);
router.put('/update/:id', updateImage);
router.get('/search', searchImage);
router.put('/view/:id', incrementViews);
router.get('/best-selling', getBestSelling);


module.exports = router;