// // routes/imageRoutes.js
// const express = require('express');
// const router = express.Router();
// const { addImage, getImages, deleteImage, updateImage, searchImage, incrementViews, getBestSelling, getItemDetails } = require('../controllers/imageController');

// router.post('/add', addImage); // Image upload is handled inside the controller
// router.get('/all', getImages);
// router.delete('/delete/:id', deleteImage);
// router.put('/update/:id', updateImage); // Image upload is handled inside the controller
// router.get('/search', searchImage);
// router.put('/view/:id', incrementViews);
// router.get('/best-selling', getBestSelling);
// router.post('/item-details', getItemDetails);


// module.exports = router;




// routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const { addImage, getImages, deleteImage, updateImage, searchImage } = require('../controllers/imageController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware'); 

router.post('/add', authMiddleware, adminMiddleware, addImage); 
router.get('/all', getImages); 
router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteImage); 
router.put('/update/:id', authMiddleware, adminMiddleware, updateImage); 
router.get('/search', searchImage); 

module.exports = router;