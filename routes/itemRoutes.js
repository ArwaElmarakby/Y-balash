const express = require('express');
const router = express.Router();
const { addItem, updateItem, deleteItem, getItems, uploadImage } = require('../controllers/itemController');

router.post('/items', uploadImage, addItem);
router.put('/items/:id', uploadImage, updateItem);
router.delete('/items/:id', deleteItem);
router.get('/items', getItems);

module.exports = router;