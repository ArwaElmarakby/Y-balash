// routes/favoriteRoutes.js
const express = require('express');
const router = express.Router();
const { addToFavorites, getFavorites, removeFromFavorites } = require('../controllers/favoriteController');
const { authMiddleware } = require('./authRoutes');

router.post('/add', authMiddleware, addToFavorites);
router.get('/', authMiddleware, getFavorites);
router.delete('/remove/:itemId', authMiddleware, removeFromFavorites);

module.exports = router;