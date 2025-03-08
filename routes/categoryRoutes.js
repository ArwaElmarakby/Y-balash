const express = require('express');
const router = express.Router();
const { addCategory, getCategories, deleteCategory, updateCategory, searchCategories, addItemToCategory, getCategoryItems, removeItemFromCategory } = require('../controllers/categoryController');

router.post('/add', addCategory); // Image upload is handled inside the controller
router.get('/all', getCategories);
router.delete('/delete', deleteCategory);
router.put('/update', updateCategory); // Image upload is handled inside the controller
router.get('/search', searchCategories);
router.post('/add-item', addItemToCategory);
// router.get('/:categoryId/items', getCategoryItems);
router.post('/items', getCategoryItems);
router.post('/remove-item', removeItemFromCategory);

module.exports = router;