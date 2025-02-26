const Cart = require('../models/cartModel');
const Image = require('../models/imageModel');

// Add item to cart
exports.addToCart = async (req, res) => {
    const { itemId, quantity } = req.body;
    const userId = req.user._id; // Get user ID from the request

    try {
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const existingItem = cart.items.find(item => item.itemId.toString() === itemId);
        if (existingItem) {
            existingItem.quantity += quantity; // Update quantity if item already exists
        } else {
            cart.items.push({ itemId, quantity });
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
        const cart = await Cart.findOne({ userId }).populate('items.itemId');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update item quantity in cart
exports.updateCartItem = async (req, res) => {
    const { itemId, quantity } = req.body;
    const userId = req.user._id;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.find(item => item.itemId.toString() === itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        item.quantity = quantity; // Update quantity
        await cart.save();
        res.status(200).json({ message: 'Cart updated', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
    const { itemId } = req.params;
    const userId = req.user._id;

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.itemId.toString() !== itemId);
        await cart.save();
        res.status(200).json({ message: 'Item removed from cart', cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};