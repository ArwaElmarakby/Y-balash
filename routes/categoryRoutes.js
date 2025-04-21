const express = require('express');
const router = express.Router();
const { addCategory, getCategories, deleteCategory, updateCategory, searchCategories, addItemToCategory, getCategoryItems, removeItemFromCategory } = require('../controllers/categoryController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');


router.post('/add', authMiddleware, adminMiddleware, addCategory); // Image upload is handled inside the controller
router.get('/all', getCategories);
router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteCategory);
router.put('/update/:id', authMiddleware, adminMiddleware, updateCategory);  // Image upload is handled inside the controller
router.get('/search', searchCategories);
router.post('/add-item', addItemToCategory);
// router.get('/:categoryId/items', getCategoryItems);
router.post('/items', getCategoryItems);
router.post('/remove-item', removeItemFromCategory);

module.exports = router;