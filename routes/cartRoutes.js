const express = require('express');
const router = express.Router();
const { addToCart, getCart, updateCartItem, removeCartItem } = require('../controllers/cartController');
const { authMiddleware } = require('./authRoutes'); // Import auth middleware

router.post('/add', authMiddleware, addToCart);
router.get('/', authMiddleware, getCart);
router.put('/update', authMiddleware, updateCartItem);
router.delete('/remove/:imageId', authMiddleware, removeCartItem);

module.exports = router;