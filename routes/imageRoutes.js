// routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const { addImage, getImages, deleteImage, updateImage } = require('../controllers/imageController');

router.post('/add', addImage);
router.get('/all', getImages);
router.delete('/delete/:id', deleteImage);
router.put('/update/:id', updateImage);

module.exports = router;