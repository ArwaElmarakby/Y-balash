const User = require('../models/userModel');
const { authMiddleware } = require('../routes/authRoutes');
const Cart = require('../models/cartModel');

exports.calculatePoints = async (req, res) => {
    const userId = req.user._id;
    const { totalAmount } = req.body; 

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        const pointsToAdd = Math.floor(totalAmount / 40) * 5;
        
        user.points += pointsToAdd;
        await user.save();

        res.status(200).json({ 
            message: 'Points added successfully',
            pointsAdded: pointsToAdd,
            totalPoints: user.points
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getUserPoints = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId).select('points');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ points: user.points });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};



exports.usePointsForDiscount = async (req, res) => {
    const userId = req.user._id;
    const { usePoints } = req.body; // true/false

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        let discountFromPoints = 0;
        let pointsUsed = 0;

        if (usePoints && user.points >= 10) {
            // 10 points = 3 EGP
            const possibleDiscounts = Math.floor(user.points / 10);
            discountFromPoints = possibleDiscounts * 3;
            pointsUsed = possibleDiscounts * 10;

            // Apply discount
            user.points -= pointsUsed;
            await user.save();
        }

        // Calculate cart totals
        let totalItemsPrice = 0;
        cart.items.forEach(item => {
            totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
        });

        let totalOffersPrice = 0;
        cart.offers.forEach(offer => {
            totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
        });

        const shippingCost = 0;
        const importCharges = (totalItemsPrice + totalOffersPrice) * 0.1;
        
        let totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges - discountFromPoints;

        res.status(200).json({
            success: true,
            pointsUsed,
            discountFromPoints,
            remainingPoints: user.points,
            cartSummary: {
                totalItems: cart.items.length,
                totalOffers: cart.offers.length,
                totalItemsPrice: totalItemsPrice.toFixed(2),
                totalOffersPrice: totalOffersPrice.toFixed(2),
                shippingCost: shippingCost.toFixed(2),
                importCharges: importCharges.toFixed(2),
                discountFromPoints: discountFromPoints.toFixed(2),
                totalPrice: totalPrice.toFixed(2)
            }
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};


exports.getPointsValue = async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // تحويل النقاط إلى جنيه (10 نقاط = 3 جنيه)
        const pointsToEgp = (user.points / 10) * 3;

        res.status(200).json({ 
            points: user.points,
            equivalentEgp: pointsToEgp.toFixed(2),
            conversionRate: "10 points = 3 EGP"
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};