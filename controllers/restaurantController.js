const Restaurant = require('../models/restaurantModel');
const Order = require('../models/orderModel');
const Image = require('../models/imageModel');
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

    if (!name || !description || !imageUrl || location) {
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
      res.status(200).json({
        ...restaurant.toObject(),
        location: restaurant.location || 'Location not specified' 
      });
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
};


exports.addImageToRestaurant = async (req, res) => {
  const { restaurantId, imageId } = req.body; 

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const image = await Image.findById(imageId); 
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    if (!restaurant.images.includes(imageId)) { 
      restaurant.images.push(imageId);
      await restaurant.save();
    }

    image.restaurant = restaurantId;
    await image.save();

    res.status(200).json({ 
      message: 'Image added to restaurant successfully', 
      restaurant 
    });
  } catch (error) {
    console.error("Error in addImageToRestaurant:", error);
    res.status(500).json({ 
      message: 'Server error',
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