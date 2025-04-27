const express = require('express');
const router = express.Router();
const sellerMiddleware = require('../middlewares/sellerMiddleware');


router.post('/products', sellerMiddleware, (req, res) => {
    res.status(200).json({ 
        success: true,
        message: 'Product added successfully by seller.',
        seller: req.seller 
    });
});

module.exports = router;