// routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const { addImage, getImages, deleteImage } = require('../controllers/imageController');

router.post('/add', addImage);
router.get('/all', getImages);
router.delete('/delete/:id', deleteImage);

module.exports = router;