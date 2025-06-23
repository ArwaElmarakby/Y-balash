// routes/offerRoutes.js
const express = require('express');
const router = express.Router();
const { addOffer, getOffers, updateOffer, deleteOffer, getOfferById } = require('../controllers/offerController');
const { authMiddleware } = require('./authRoutes');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/add', authMiddleware, adminMiddleware, addOffer); // Add Today's Offer

router.get('/all', getOffers); // Get All Offers
router.get('/:id', getOfferById); // Get a single offer by ID
router.put('/update/:id', authMiddleware, adminMiddleware, updateOffer); // Update Offer
router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteOffer); // Delete Offer

module.exports = router;