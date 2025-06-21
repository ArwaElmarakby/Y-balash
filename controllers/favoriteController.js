// // controllers/favoriteController.js
// const Favorite = require('../models/favoriteModel');
// const Image = require('../models/imageModel');

// // Add image to favorites
// exports.addToFavorites = async (req, res) => {
//     const { itemId } = req.body;
//     const userId = req.user._id; // Get user ID from the request

//     try {
//         // Check if the image exists
//         const image = await Image.findById(itemId);
//         if (!image) {
//             return res.status(404).json({ message: 'Image not found' });
//         }

//         // Check if the image is already in favorites
//         const existingFavorite = await Favorite.findOne({ userId, itemId });
//         if (existingFavorite) {
//             return res.status(400).json({ message: 'Image already in favorites' });
//         }

//         // Add to favorites
//         const favorite = new Favorite({ userId, itemId });
//         await favorite.save();

//         res.status(200).json({ message: 'Image added to favorites', favorite });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

// // Get user's favorite images
// exports.getFavorites = async (req, res) => {
//     const userId = req.user._id;

//     try {
//         const favorites = await Favorite.find({ userId }).populate('itemId');
//         res.status(200).json(favorites);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

// // Remove image from favorites
// exports.removeFromFavorites = async (req, res) => {
//     const { itemId } = req.params;
//     const userId = req.user._id;

//     try {
//         const favorite = await Favorite.findOneAndDelete({ userId, itemId });
//         if (!favorite) {
//             return res.status(404).json({ message: 'Image not found in favorites' });
//         }

//         res.status(200).json({ message: 'Image removed from favorites' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };




// controllers/favoriteController.js
const Favorite = require('../models/favoriteModel');
const Image = require('../models/imageModel');

// Add image to favorites
exports.addToFavorites = async (req, res) => {
    const { itemId } = req.body;
    const userId = req.user._id; // Get user ID from the request

    try {
        // Check if the image exists
        const image = await Image.findById(itemId);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Check if the image is already in favorites
        const existingFavorite = await Favorite.findOne({ userId, itemId });
        if (existingFavorite) {
            return res.status(400).json({ message: 'Image already in favorites' });
        }

        // Add to favorites
        const favorite = new Favorite({ userId, itemId });
        await favorite.save();

        res.status(200).json({ message: 'Image added to favorites', favorite });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get user's favorite images
exports.getFavorites = async (req, res) => {
    const userId = req.user._id;

    try {
        const favorites = await Favorite.find({ userId }).populate('itemId');
        res.status(200).json(favorites);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Remove image from favorites
exports.removeFromFavorites = async (req, res) => {
    const { itemId } = req.params;
    const userId = req.user._id;

    try {
        const favorite = await Favorite.findOneAndDelete({ userId, itemId });
        if (!favorite) {
            return res.status(404).json({ message: 'Image not found in favorites' });
        }

        res.status(200).json({ message: 'Image removed from favorites' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
