// routes/locationRoutes.js
const express = require('express');
const router = express.Router();
const { setLocation, getMapData } = require('../controllers/locationController');
const { authMiddleware } = require('./authRoutes'); 

// Set user location
router.post('/set-location', authMiddleware, setLocation); 

// Get map data
router.get('/map-data', getMapData); 

module.exports = router;