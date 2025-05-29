const ClientInfo = require('../models/clientInfoModel');

exports.createClientInfo = async (req, res) => {
    const { firstName, lastName, shippingAddress, country, email, phone } = req.body;

    if (!firstName || !lastName || !shippingAddress || !country || !email || !phone) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const clientInfo = new ClientInfo({
            userId: req.user._id,
            firstName,
            lastName,
            shippingAddress,
            country,
            email,
            phone
        });

        await clientInfo.save();
        res.status(201).json({ message: 'Client information saved successfully', clientInfo });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getClientInfo = async (req, res) => {
    try {
        const clientInfo = await ClientInfo.findOne({ userId: req.user._id });
        if (!clientInfo) {
            return res.status(404).json({ message: 'Client information not found' });
        }
        res.status(200).json(clientInfo);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateClientInfo = async (req, res) => {
    const { firstName, lastName, shippingAddress, country, email, phone } = req.body;

    try {
        const clientInfo = await ClientInfo.findOneAndUpdate(
            { userId: req.user._id },
            { firstName, lastName, shippingAddress, country, email, phone },
            { new: true }
        );

        if (!clientInfo) {
            return res.status(404).json({ message: 'Client information not found' });
        }

        res.status(200).json({ message: 'Client information updated successfully', clientInfo });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteClientInfo = async (req, res) => {
    try {
        const clientInfo = await ClientInfo.findOneAndDelete({ userId: req.user._id });
        if (!clientInfo) {
            return res.status(404).json({ message: 'Client information not found' });
        }
        res.status(200).json({ message: 'Client information deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
