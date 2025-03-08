const Category = require('../models/categoryModel');
const Image = require('../models/imageModel');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  // Multer + Cloudinary Storage
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "categories", // Folder name on Cloudinary
      allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
    },
  });
  
  const upload = multer({ storage: storage }).single("image"); // Use single file upload



exports.addCategory = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Image upload failed", error: err });
    }

    const { name } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Get Cloudinary image URL

    if (!name || !imageUrl) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const newCategory = new Category({ name, imageUrl });
      await newCategory.save();
      res.status(201).json({ message: 'Category added successfully', category: newCategory });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });
};


exports.addItemToCategory = async (req, res) => {
  const { categoryId, itemId } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const item = await Image.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    category.items.push(itemId);
    await category.save();

    item.category = categoryId;
    await item.save();

    res.status(200).json({ message: 'Item added to category successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



exports.getCategoryItems = async (req, res) => {
  const { categoryId } = req.body; 

  try {
    const category = await Category.findById(categoryId).populate('items');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(category.items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.removeItemFromCategory = async (req, res) => {
  const { categoryId, itemId } = req.body;

  try {

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }


    const item = await Image.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }


    category.items = category.items.filter(
      (item) => item.toString() !== itemId
    );
    await category.save();


    item.category = null;
    await item.save();

    res.status(200).json({ message: 'Item removed from category successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.getCategories = async (req, res) => {
    try {
      const categories = await Category.find();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };


  exports.deleteCategory = async (req, res) => {
    const { id } = req.body;
  
    try {
      const category = await Category.findByIdAndDelete(id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };


  exports.updateCategory = async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: "Image upload failed", error: err });
      }
  
      const { id, name } = req.body;
      const imageUrl = req.file ? req.file.path : null; // Get Cloudinary image URL
  
      try {
        const updatedData = { name };
        if (imageUrl) updatedData.imageUrl = imageUrl; // Update imageUrl only if a new image is uploaded
  
        const updatedCategory = await Category.findByIdAndUpdate(
          id,
          updatedData,
          { new: true }
        );
  
        if (!updatedCategory) {
          return res.status(404).json({ message: 'Category not found' });
        }
  
        res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
      } catch (error) {
        res.status(500).json({ message: 'Server error', error });
      }
    });
  };
  

  exports.searchCategories = async (req, res) => {
    const { name } = req.query;
  
    try {
      const categories = await Category.find({ name: { $regex: name, $options: 'i' } });
  
      if (categories.length === 0) {
        return res.status(404).json({ message: 'No categories found' });
      }
  
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };