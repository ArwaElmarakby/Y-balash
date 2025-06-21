// controllers/couponController.js
const Coupon = require('../models/couponModel');

exports.addCoupon = async (req, res) => {
    const { code, discountType, discountValue, validUntil } = req.body;

    try {
       
        const newCoupon = new Coupon({
            code,
            discountType,
            discountValue,
            validUntil: new Date(validUntil), 
        });

        
        await newCoupon.save();

        res.status(201).json({ message: 'Coupon added successfully', coupon: newCoupon });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};