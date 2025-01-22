const express = require('express');
const router = express.Router();
const { addCategory, getCategories, deleteCategory, updateCategory, searchCategories  } = require('../controllers/categoryController');

router.post('/add', addCategory); 
router.get('/all', getCategories); 
router.delete('/delete/:id', deleteCategory); 
router.put('/update/:id', updateCategory); 
router.get('/search', searchCategories);

module.exports = router;