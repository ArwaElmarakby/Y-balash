// routes/deliveryRoutes.js
const express = require('express');
const router = express.Router();
const { addAddress, getAddresses, updateAddress, deleteAddress } = require('../controllers/deliveryController');
const { authMiddleware } = require('./authRoutes');

// Add a new address
router.post('/address', authMiddleware, addAddress);

// Get all addresses for a user
router.get('/addresses', authMiddleware, getAddresses);

// Update an address
router.put('/address', authMiddleware, updateAddress);

// Delete an address
router.delete('/address', authMiddleware, deleteAddress);

module.exports = router;