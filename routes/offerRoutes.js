// routes/offerRoutes.js
const express = require('express');
const router = express.Router();
const { addOffer, getOffers, updateOffer, deleteOffer } = require('../controllers/offerController');

router.post('/add', addOffer); // Add Today's Offer
router.get('/all', getOffers); // Get All Offers
router.put('/update/:id', updateOffer); // Update Offer
router.delete('/delete/:id', deleteOffer); // Delete Offer

module.exports = router;