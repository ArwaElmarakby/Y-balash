const Restaurant = require('../models/restaurantModel');
const Order = require('../models/orderModel');
const Image = require('../models/imageModel');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');


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
      folder: "restaurants", // Folder name on Cloudinary
      allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
    },
  });
  
  const upload = multer({ storage: storage }).single("image");



exports.addRestaurant = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Image upload failed", error: err });
    }

    const { name, description, location } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Get Cloudinary image URL

    if (!name || !description  || !location || !imageUrl) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const newRestaurant = new Restaurant({ name, imageUrl, description, location });
      await newRestaurant.save();
      res.status(201).json({ message: 'Restaurant added successfully', restaurant: newRestaurant });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });
};


exports.getRestaurants = async (req, res) => {
    try {
      const restaurants = await Restaurant.find();
      res.status(200).json(restaurants);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };


  exports.deleteRestaurant = async (req, res) => {
    const { id } = req.params;
  
    try {
      const restaurant = await Restaurant.findByIdAndDelete(id);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      res.status(200).json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };


  exports.updateRestaurant = async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: "Image upload failed", error: err });
      }
  
      const { id } = req.params;
      const { name, description, location } = req.body;
      const imageUrl = req.file ? req.file.path : null; // Get Cloudinary image URL
  
      try {
        const updatedData = { name, description, location };
        if (imageUrl) updatedData.imageUrl = imageUrl; // Update imageUrl only if a new image is uploaded
  
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
          id,
          updatedData,
          { new: true }
        );
  
        if (!updatedRestaurant) {
          return res.status(404).json({ message: 'Restaurant not found' });
        }
  
        res.status(200).json({ message: 'Restaurant updated successfully', restaurant: updatedRestaurant });
      } catch (error) {
        res.status(500).json({ message: 'Server error', error });
      }
    });
  };
  



  exports.searchRestaurants = async (req, res) => {
    const { name } = req.query;
  
    try {
      const restaurants = await Restaurant.find({ name: { $regex: name, $options: 'i' } });
  
      if (restaurants.length === 0) {
        return res.status(404).json({ message: 'No restaurants found' });
      }
  
      res.status(200).json(restaurants);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };



  exports.getTotalOrders = async (req, res) => {
    const { id } = req.params; // Get restaurant ID from the URL

    try {
        const totalOrders = await Order.countDocuments({ restaurantId: id }); // Count orders for the restaurant
        res.status(200).json({ totalOrders });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};



exports.getRestaurantById = async (req, res) => {
  const { id } = req.params;

  try {
      const restaurant = await Restaurant.findById(id);
      if (!restaurant) {
          return res.status(404).json({ message: 'Restaurant not found' });
      }
      res.status(200).json(restaurant);
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
};


exports.addImageToRestaurant = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          message: "Image upload failed",
          error: err.message 
        });
      }

      const { name, price, quantity, categoryId } = req.body;
      const imageUrl = req.file ? req.file.path : null;

      if (!name || !price || !quantity || !categoryId || !imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Name, price, quantity, categoryId and image are required"
        });
      }

      const seller = await User.findById(req.user._id);
      if (!seller || !seller.isSeller || !seller.managedRestaurant) {
        return res.status(403).json({
          success: false,
          message: "Only sellers with assigned restaurants can add items"
        });
      }

      const restaurantId = seller.managedRestaurant;

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found"
        });
      }

      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }

      const newItem = new Image({
        name,
        price,
        quantity,
        imageUrl,
        category: categoryId,
        restaurant: restaurantId
      });

      await newItem.save();

      restaurant.images.push(newItem._id);
      await restaurant.save();

      category.items.push(newItem._id);
      await category.save();

      return res.status(201).json({
        success: true,
        message: "Item added successfully",
        data: {
          item: {
            id: newItem._id,
            name: newItem.name,
            price: newItem.price,
            quantity: newItem.quantity,
            imageUrl: newItem.imageUrl
          },
          restaurant: {
            id: restaurant._id,
            name: restaurant.name
          },
          category: {
            id: category._id,
            name: category.name
          }
        }
      });
    });
  } catch (error) {
    console.error("Error in addImageToRestaurant:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.getRestaurantById = async (req, res) => {
  const { id } = req.params;

  try {
    const restaurant = await Restaurant.findById(id).populate('images'); 
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json(restaurant);
  } catch (error) {
    console.error("Error in getRestaurantById:", error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
};


exports.removeImageFromRestaurant = async (req, res) => {
  const { restaurantId, imageId } = req.body;

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.images = restaurant.images.filter(img => img.toString() !== imageId);
    await restaurant.save();

    const image = await Image.findById(imageId);
    if (image) {
      image.restaurant = null;
      await image.save();
    }

    res.status(200).json({ 
      message: 'Image removed from restaurant successfully', 
      restaurant 
    });
  } catch (error) {
    console.error("Error in removeImageFromRestaurant:", error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
};



exports.getTotalRestaurants = async (req, res) => {
  try {
      const total = await Restaurant.countDocuments();
      res.status(200).json({ totalRestaurants: total });
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
};



exports.getRestaurantBalance = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.managedRestaurant);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json({ 
      balance: restaurant.balance,
      currency: 'EGP' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};