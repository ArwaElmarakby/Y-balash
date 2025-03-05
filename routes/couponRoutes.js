// routes/couponRoutes.js
const express = require('express');
const router = express.Router();
const { addCoupon } = require('../controllers/couponController'); 


router.post('/add', addCoupon); 

module.exports = router;