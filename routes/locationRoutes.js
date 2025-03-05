// routes/locationRoutes.js
const express = require('express');
const router = express.Router();
const { setLocation } = require('../controllers/locationController');
const { authMiddleware } = require('./authRoutes'); 

// Set user location
router.post('/set-location', authMiddleware, setLocation); 

module.exports = router;