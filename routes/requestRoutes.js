const express = require('express');
const router = express.Router();
const { getPendingRequests } = require('../controllers/requestController');

router.get('/pending', getPendingRequests); 

module.exports = router;
