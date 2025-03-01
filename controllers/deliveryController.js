
const Address = require('../models/addressModel');

// Add a new address for a user
exports.addAddress = async (req, res) => {
    const { street, city, state, postalCode, country } = req.body;
    const userId = req.user._id; // Get user ID from the request

    try {
        const newAddress = new Address({ userId, street, city, state, postalCode, country });
        await newAddress.save();
        res.status(201).json({ message: 'Address added successfully', address: newAddress });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get all addresses for a user
exports.getAddresses = async (req, res) => {
    const userId = req.user._id;

    try {
        const addresses = await Address.find({ userId });
        res.status(200).json(addresses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update an address
exports.updateAddress = async (req, res) => {
    const { addressId } = req.params;
    const { street, city, state, postalCode, country } = req.body;

    try {
        const updatedAddress = await Address.findByIdAndUpdate(
            addressId,
            { street, city, state, postalCode, country },
            { new: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.status(200).json({ message: 'Address updated successfully', address: updatedAddress });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
    const { addressId } = req.params;

    try {
        const address = await Address.findByIdAndDelete(addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};