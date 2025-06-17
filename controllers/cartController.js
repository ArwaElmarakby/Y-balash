const Cart = require('../models/cartModel');
const Image = require('../models/imageModel');
const Offer = require('../models/offerModel');
const Coupon = require('../models/couponModel');

// Add item to cart
exports.addToCart = async (req, res) => {
    const { itemId, offerId, quantity } = req.body;
    const userId = req.user._id; // Get user ID from the request

    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [], offers: [] });
        }

        if (itemId) {
            const existingItem = cart.items.find(item => item.itemId.toString() === itemId);
            if (existingItem) {
                existingItem.quantity += quantity; // Update quantity if item already exists
            } else {
                cart.items.push({ itemId, quantity });
            }
        }

        if (offerId) {
            const existingOffer = cart.offers.find(offer => offer.offerId.toString() === offerId);
            if (existingOffer) {
                existingOffer.quantity += quantity; // Update quantity if offer already exists
            } else {
                cart.offers.push({ offerId, quantity });
            }
        }


        await cart.save();
        res.status(200).json({ message: 'Item added to cart', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get user's cart
exports.getCart = async (req, res) => {
    const userId = req.user._id;

    try {
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        res.status(200).json(cart);
    } catch (error) {
        console.error("Error in getCart:", error); 
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update item quantity in cart
exports.updateCartItem = async (req, res) => {
    const { itemId, offerId, quantity } = req.body;
    const userId = req.user._id;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        if (itemId) {
            const item = cart.items.find(item => item.itemId.toString() === itemId);
            if (!item) {
                return res.status(404).json({ message: 'Item not found in cart' });
            }
            item.quantity = quantity; // Update quantity
        }

        if (offerId) {
            const offer = cart.offers.find(offer => offer.offerId.toString() === offerId);
            if (!offer) {
                return res.status(404).json({ message: 'Offer not found in cart' });
            }
            offer.quantity = quantity; // Update quantity
        }

        await cart.save();
        res.status(200).json({ message: 'Cart updated', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
    const { param1, param2 } = req.params; 
    const userId = req.user._id;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        if (param1 && !param2) {

            const isItem = cart.items.some(item => item.itemId.toString() === param1);
            const isOffer = cart.offers.some(offer => offer.offerId.toString() === param1);

            if (isItem) {
                cart.items = cart.items.filter(item => item.itemId.toString() !== param1);
            } else if (isOffer) {
                cart.offers = cart.offers.filter(offer => offer.offerId.toString() !== param1);
            } else {
                return res.status(404).json({ message: 'Item/Offer not found in cart' });
            }
        } else if (param1 && param2) {

            cart.items = cart.items.filter(item => item.itemId.toString() !== param1);
            cart.offers = cart.offers.filter(offer => offer.offerId.toString() !== param2);
        } else {
            return res.status(400).json({ message: 'Invalid request' });
        }

        await cart.save();
        res.status(200).json({ message: 'Item/Offer removed from cart', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};



// exports.getCartSummary = async (req, res) => {
//     const userId = req.user._id; 

//     try {
//         const cart = await Cart.findOne({ userId })
//             .populate('items.itemId')
//             .populate('offers.offerId');
//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found' });
//         }

//         let totalItemsPrice = 0;
//         cart.items.forEach(item => {
//             totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
//         });

//         let totalOffersPrice = 0;
//         cart.offers.forEach(offer => {
//             totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
//         });

//         const shippingCost = 50; 
//         const importCharges = (totalItemsPrice + totalOffersPrice) * 0.1; 

//         const totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

//         res.status(200).json({
//             totalItems: cart.items.length, 
//             totalOffers: cart.offers.length,
//             totalItemsPrice: totalItemsPrice.toFixed(2), 
//             totalOffersPrice: totalOffersPrice.toFixed(2), 
//             shippingCost: shippingCost.toFixed(2), 
//             importCharges: importCharges.toFixed(2), 
//             totalPrice: totalPrice.toFixed(2), 
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };



// exports.applyCoupon = async (req, res) => {
//     const { couponCode } = req.body; 
//     const userId = req.user._id; 

//     try {
//         const coupon = await Coupon.findOne({ code: couponCode });
//         if (!coupon) {
//             return res.status(404).json({ message: 'Coupon not found' });
//         }

//         if (coupon.validUntil < new Date()) {
//             return res.status(400).json({ message: 'Coupon has expired' });
//         }

//         const cart = await Cart.findOne({ userId })
//             .populate('items.itemId')
//             .populate('offers.offerId');
//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found' });
//         }

//         let totalItemsPrice = 0;
//         cart.items.forEach(item => {
//             totalItemsPrice += item.quantity * parseFloat(item.itemId.price);
//         });

//         let totalOffersPrice = 0;
//         cart.offers.forEach(offer => {
//             totalOffersPrice += offer.quantity * parseFloat(offer.offerId.price);
//         });

//         const shippingCost = 50; 
//         const importCharges = (totalItemsPrice + totalOffersPrice) * 0.1;

//         let totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

//         let discount = 0;
//         if (coupon.discountType === 'percentage') {
//             discount = totalPrice * (coupon.discountValue / 100);
//         } else if (coupon.discountType === 'fixed') {
//             discount = coupon.discountValue;
//         }

//         totalPrice -= discount;

//         res.status(200).json({
//             totalItems: cart.items.length, 
//             totalOffers: cart.offers.length,
//             totalItemsPrice: totalItemsPrice.toFixed(2), 
//             totalOffersPrice: totalOffersPrice.toFixed(2), 
//             shippingCost: shippingCost.toFixed(2), 
//             importCharges: importCharges.toFixed(2),
//             discount: discount.toFixed(2), 
//             totalPrice: totalPrice.toFixed(2), 
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };



exports.getCartSummary = async (req, res) => {
    const userId = req.user._id; 

    try {
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

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

        const totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;

        // Get user points information
        const user = await User.findById(userId).select('points');
        const maxPointsDiscount = calculateDiscountFromPoints(user.points);

        res.status(200).json({
            totalItems: cart.items.length, 
            totalOffers: cart.offers.length,
            totalItemsPrice: totalItemsPrice.toFixed(2), 
            totalOffersPrice: totalOffersPrice.toFixed(2), 
            shippingCost: shippingCost.toFixed(2), 
            importCharges: importCharges.toFixed(2), 
            totalPrice: totalPrice.toFixed(2),
            pointsDiscount: {
                availablePoints: user.points,
                maxDiscount: maxPointsDiscount,
                conversionRate: "10 points = 3 EGP"
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Helper function (same as in pointsController)
function calculateDiscountFromPoints(points) {
    return Math.floor(points / 10) * 3;
}

exports.applyCoupon = async (req, res) => {
    const { couponCode, usePoints = false } = req.body; 
    const userId = req.user._id; 

    try {
        // First get cart total without any discounts
        const cart = await Cart.findOne({ userId })
            .populate('items.itemId')
            .populate('offers.offerId');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

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

        let totalPrice = totalItemsPrice + totalOffersPrice + shippingCost + importCharges;
        let discount = 0;
        let pointsDiscount = 0;
        let pointsUsed = 0;

        // Apply coupon discount if provided
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode });
            if (!coupon) {
                return res.status(404).json({ message: 'Coupon not found' });
            }

            if (coupon.validUntil < new Date()) {
                return res.status(400).json({ message: 'Coupon has expired' });
            }

            if (coupon.discountType === 'percentage') {
                discount = totalPrice * (coupon.discountValue / 100);
            } else if (coupon.discountType === 'fixed') {
                discount = coupon.discountValue;
            }
        }

        // Apply points discount if requested
        if (usePoints) {
            const user = await User.findById(userId);
            if (user.points >= 10) { // Minimum 10 points required
                pointsDiscount = calculateDiscountFromPoints(user.points);
                pointsUsed = Math.floor(pointsDiscount * (10 / 3));
                
                // Update user points
                user.points -= pointsUsed;
                await user.save();
            }
        }

        // Calculate final price after all discounts
        totalPrice = totalPrice - discount - pointsDiscount;

        res.status(200).json({
            totalItems: cart.items.length, 
            totalOffers: cart.offers.length,
            totalItemsPrice: totalItemsPrice.toFixed(2), 
            totalOffersPrice: totalOffersPrice.toFixed(2), 
            shippingCost: shippingCost.toFixed(2), 
            importCharges: importCharges.toFixed(2),
            couponDiscount: discount.toFixed(2), 
            pointsDiscount: pointsDiscount.toFixed(2),
            pointsUsed: pointsUsed,
            remainingPoints: (await User.findById(userId).select('points')).points,
            totalPrice: totalPrice.toFixed(2), 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};