const express = require('express');
const router = express.Router();
const { createClientInfo, getClientInfo, updateClientInfo, deleteClientInfo } = require('../controllers/clientInfoController');
const { authMiddleware } = require('./authRoutes');

router.post('/', authMiddleware, createClientInfo); // Create client info
router.get('/', authMiddleware, getClientInfo); // Get client info
router.put('/', authMiddleware, updateClientInfo); // Update client info
router.delete('/', authMiddleware, deleteClientInfo); // Delete client info

module.exports = router;
