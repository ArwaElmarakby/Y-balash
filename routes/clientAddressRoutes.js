// routes/clientAddressRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/clientAddressController');
const { authMiddleware } = require('./authRoutes');


router.post('/', authMiddleware, createAddress);


router.get('/', authMiddleware, getUserAddresses);


router.put('/:id', authMiddleware, updateAddress);


router.delete('/:id', authMiddleware, deleteAddress);


router.patch('/:id/set-default', authMiddleware, setDefaultAddress);

module.exports = router;