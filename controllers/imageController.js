// controllers/imageController.js
const Image = require('../models/imageModel');
const Category = require('../models/categoryModel');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');


// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  // Multer + Cloudinary Storage
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "images", // Folder name on Cloudinary
      allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
    },
  });
  
  const upload = multer({ storage: storage }).single("image"); // Use single file upload



// exports.addImage = async (req, res) => {
//   upload(req, res, async (err) => {
//     if (err) {
//       return res.status(500).json({ message: "Image upload failed", error: err });
//     }

//     const { name, quantity, price } = req.body;
//     const imageUrl = req.file ? req.file.path : null; // Get Cloudinary image URL

//     if (!name || !quantity || !price || !imageUrl) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     try {
//       const newImage = new Image({ name, quantity, price, imageUrl });
//       await newImage.save();
//       res.status(201).json({ message: 'Item added successfully', image: newImage });
//     } catch (error) {
//       res.status(500).json({ message: 'Server error', error });
//     }
//   });
// };


exports.addImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Image upload failed", error: err });
    }

    const { name, quantity, price, categoryId } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    if (!name || !quantity || !price || !imageUrl || !categoryId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      const newImage = new Image({ name, quantity, price, imageUrl, category: categoryId });
      await newImage.save();

      category.items.push(newImage._id);
      await category.save();

      res.status(201).json({ message: 'Item added successfully', image: newImage });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });
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
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: "Image upload failed", error: err });
      }
  
      const { id } = req.params;
      const { name, quantity, price } = req.body;
      const imageUrl = req.file ? req.file.path : null; // Get Cloudinary image URL
  
      try {
        const updatedData = { name, quantity, price };
        if (imageUrl) updatedData.imageUrl = imageUrl; // Update imageUrl only if a new image is uploaded
  
        const updatedImage = await Image.findByIdAndUpdate(
          id,
          updatedData,
          { new: true }
        );
  
        if (!updatedImage) {
          return res.status(404).json({ message: 'Image not found' });
        }
  
        res.status(200).json({ message: 'Item updated successfully', image: updatedImage });
      } catch (error) {
        res.status(500).json({ message: 'Server error', error });
      }
    });
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



exports.getItemDetails = async (req, res) => {
  const { id } = req.body; 

  try {
      
      const item = await Image.findById(id);
      if (!item) {
          return res.status(404).json({ message: 'Item not found' });
      }

     
      res.status(200).json(item);
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
};