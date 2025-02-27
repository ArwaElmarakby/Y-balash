// routes/offerRoutes.js
const express = require('express');
const router = express.Router();
const { addOffer, getOffers } = require('../controllers/offerController');

router.post('/add', addOffer); // Add Today's Offer
router.get('/all', getOffers); // Get All Offers

module.exports = router;