// // routes/cartRoutes.js
// const express = require('express');
// const router = express.Router();
// const { addToCart, getCart, updateCartItem, removeCartItem, getCartSummary, applyCoupon  } = require('../controllers/cartController');
// const { authMiddleware } = require('./authRoutes');

// router.post('/add', authMiddleware, addToCart);
// router.get('/', authMiddleware, getCart);
// router.put('/update', authMiddleware, updateCartItem);
// router.delete('/remove/:param1?/:param2?', authMiddleware, removeCartItem);
// router.get('/summary', authMiddleware, getCartSummary);
// router.post('/apply-coupon', authMiddleware, applyCoupon);

// module.exports = router;


// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const { addToCart, getCart, updateCartItem, removeCartItem, getCartSummary, applyCoupon  } = require('../controllers/cartController');
const { authMiddleware } = require('./authRoutes');

router.post('/add', authMiddleware, addToCart);
router.get('/', authMiddleware, getCart);
router.put('/update', authMiddleware, updateCartItem);
router.delete('/remove/:param1?/:param2?', authMiddleware, removeCartItem);
router.get('/summary', authMiddleware, getCartSummary);
router.post('/apply-coupon', authMiddleware, applyCoupon);

module.exports = router;
