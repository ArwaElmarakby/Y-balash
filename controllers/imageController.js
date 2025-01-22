// controllers/imageController.js
const Image = require('../models/imageModel');

exports.addImage = async (req, res) => {
    const { name, quantity, price, imageUrl } = req.body;

    try {
        const newImage = new Image({ name, quantity, price, imageUrl });
        await newImage.save();
        res.status(201).json({ message: 'Item added successfully', image: newImage });
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
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.updateImage = async (req, res) => {
    const { id } = req.params;    
    const { name, imageUrl, quantity, price } = req.body;  

    try {

        const updatedImage = await Image.findByIdAndUpdate(
            id,
            { name, imageUrl, quantity, price },
            { new: true }  
        );

        if (!updatedImage) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.status(200).json({ message: 'Item updated successfully', image: updatedImage });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.searchImage = async (req, res) => {
    const { name } = req.query; 

    try {

        const images = await Image.find({ name: { $regex: name, $options: 'i' } });

        if (images.length === 0) {
            return res.status(404).json({ message: 'No items found' });
        }

        res.status(200).json(images);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


exports.incrementViews = async (req, res) => {
    const { id } = req.params;

    try {
        const image = await Image.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } }, 
            { new: true }
        );

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.status(200).json({ message: 'Views incremented', image });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};



exports.getBestSelling = async (req, res) => {
    try {
        const bestSelling = await Image.find().sort({ views: -1 }).limit(4); 
        res.status(200).json(bestSelling);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
