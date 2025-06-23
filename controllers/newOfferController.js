const Offer = require('../models/offerModel');
const { logActivity } = require('./activityController');

exports.addNewOffer = async (req, res) => {
  try {
    const { title, subject, description, price, validUntil } = req.body;
    
    if (!title || !subject || !description || !price || !req.file) {
      return res.status(400).json({ 
        success: false,
        message: "All fields including image are required"
      });
    }

    const newOffer = new Offer({
      title,
      subject,
      description,
      price,
      imageUrl: req.file.path,
      validUntil: new Date(validUntil)
    });

    await newOffer.save();

    await logActivity('offer_added', req.user._id, {
      offerTitle: title,
      offerId: newOffer._id
    });

    res.status(201).json({
      success: true,
      message: 'Offer added successfully',
      offer: newOffer
    });

  } catch (error) {
    console.error("Error adding new offer:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to add offer',
      error: error.message
    });
  }
};