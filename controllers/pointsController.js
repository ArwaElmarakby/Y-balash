const User = require('../models/userModel');
const { authMiddleware } = require('../routes/authRoutes');

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

        let discount = 0;
        let pointsUsed = 0;

        if (usePoints && user.points >= 10) {
            // Calculate how many 10-point blocks we can use
            const pointsBlocks = Math.floor(user.points / 10);
            discount = pointsBlocks * 3; // 3 EGP per 10 points
            pointsUsed = pointsBlocks * 10;
            
            // Update user points (we'll finalize this when order is placed)
            req.session.pointsUsed = pointsUsed;
            req.session.pointsDiscount = discount;
        } else if (usePoints) {
            return res.status(400).json({ 
                message: 'You need at least 10 points to get a discount' 
            });
        } else {
            // Not using points - clear any previous selection
            req.session.pointsUsed = 0;
            req.session.pointsDiscount = 0;
        }

        // Get updated cart summary with the points discount
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Calculate cart totals (similar to getCartSummary)
        let totalItemsPrice = 0;
        cart.items.forEach(item => {
            totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
        });

        let totalOffersPrice = 0;
        cart.offers.forEach(offer => {
            totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
        });

        const shippingCost = 50;
        const importCharges = (totalItemsPrice + totalOffersPrice) * 0.1;

        // Apply points discount
        const totalBeforeDiscount = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;
        const totalPrice = Math.max(0, totalBeforeDiscount - discount);

        res.status(200).json({
            success: true,
            usePoints,
            pointsUsed,
            discount,
            cartSummary: {
                totalItems: cart.items.length,
                totalOffers: cart.offers.length,
                totalItemsPrice: totalItemsPrice.toFixed(2),
                totalOffersPrice: totalOffersPrice.toFixed(2),
                shippingCost: shippingCost.toFixed(2),
                importCharges: importCharges.toFixed(2),
                pointsDiscount: discount.toFixed(2),
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