const express = require('express');
const router = express.Router();
const { requestWithdrawal, approveWithdrawal } = require('../controllers/withdrawalController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');

// Route for seller to request a withdrawal
router.post('/request', authMiddleware, requestWithdrawal);

// Route for admin to approve or reject a withdrawal
router.put('/approve/:id', authMiddleware, adminMiddleware, approveWithdrawal);

module.exports = router;
