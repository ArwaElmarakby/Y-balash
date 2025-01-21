// controllers/imageController.js
const Image = require('../models/imageModel');

exports.addImage = async (req, res) => {
    const { name, quantity, price, imageUrl } = req.body;

    try {
        const newImage = new Image({ name, quantity, price, imageUrl });
        await newImage.save();
        res.status(201).json({ message: 'Image added successfully', image: newImage });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getImages = async (req, res) => {
    try {
        const images = await Image.find();
        res.status(200).json(images);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.deleteImage = async (req, res) => {
    const { id } = req.params;

    try {
        const image = await Image.findByIdAndDelete(id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};