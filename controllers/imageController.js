// controllers/imageController.js
const Image = require('../models/imageModel');
const Category = require('../models/categoryModel');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const axios = require('axios');
const cron = require('node-cron');
const { logActivity } = require('./activityController');

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


exports.calculateDiscountedPrice = async (productionDate, expiryDate, originalPrice) => {
  try {
    const response = await axios.post('http://185.225.233.14:8001/predict_price', {
      production_date: productionDate,
      expiry_date: expiryDate,
      price_fresh: originalPrice
    });
    
    return response.data.predicted_price;
  } catch (error) {
    console.error('Error calculating discounted price:', error);
    return originalPrice; 
  }
};


cron.schedule('0 2 * * *', async () => {
  try {
    console.log('Running daily price update job...');
    
    const products = await Image.find({
      expiryDate: { $exists: true, $ne: null },
      productionDate: { $exists: true, $ne: null }
    });
    
    for (const product of products) {
      try {
        const discountedPrice = await exports.calculateDiscountedPrice(
          product.productionDate,
          product.expiryDate,
          product.price
        );
        
        await Image.findByIdAndUpdate(product._id, {
          $set: {
            'discount.percentage': calculateDiscountPercentage(product.price, discountedPrice),
            'discount.stock': product.quantity,
            price: discountedPrice
          }
        });
        
        console.log(`Updated price for product ${product.name}`);
      } catch (error) {
        console.error(`Error updating product ${product.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in price update job:', error);
  }
});


function calculateDiscountPercentage(originalPrice, discountedPrice) {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}


exports.addImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "Image upload failed", error: err });
    }

    const { name, quantity, price, categoryId, discountPercentage, discountStartDate, discountEndDate, sku, description, restaurantId, productionDate, expiryDate } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    if (!name || !quantity || !price || !imageUrl || !categoryId || !productionDate || !expiryDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      
      const discountedPrice = await exports.calculateDiscountedPrice(
        productionDate,
        expiryDate,
        price
      );

      const discount = {
        percentage: calculateDiscountPercentage(price, discountedPrice),
        startDate: discountStartDate || new Date(),
        endDate: discountEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        stock: quantity
      };

      if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant ID is required" });
      }

      const newImage = new Image({ 
        name, 
        sku, 
        description, 
        quantity, 
        price: discountedPrice, 
        imageUrl, 
        category: categoryId, 
        restaurant: restaurantId, 
        discount,
        productionDate: productionDate ? productionDate.split('T')[0] : null, 
        expiryDate: expiryDate ? expiryDate.split('T')[0] : null 
      });

      await newImage.save();

//       category.items.push(newImage._id);
//       await category.save();

//       await logActivity('product_added', req.user._id, {
//     productName: name,
//     productId: newImage._id
// });

if (newImage.quantity <= 12) {
        await logActivity('product_added_low_stock', req.user._id, {
          productName: newImage.name,
          productId: newImage._id,
          quantity: newImage.quantity
        });

        // إرسال إشعار للمتجر إذا كان البائع
        if (req.user.isSeller && req.user.managedRestaurant) {
          await createNotification(
            req.user._id,
            req.user.managedRestaurant,
            'stock',
            'New Low Stock Item Added',
            `${newImage.name} was added with low quantity (${newImage.quantity})`,
            newImage._id
          );
        }
      }



      res.status(201).json({ 
        message: 'Item added successfully', 
        image: newImage,
        originalPrice: price, 
        discountedPrice: discountedPrice 
      });
    } catch (error) {
      if (error.code === 11000 && error.keyPattern.sku) {
        return res.status(400).json({ 
          message: 'SKU must be unique', 
          error: 'Duplicate SKU' 
        });
      }
      res.status(500).json({ message: 'Server error', error });
    }
  });
};

// exports.getImages = async (req, res) => {
//     try {
//       const images = await Image.find();
//       res.status(200).json(images);
//     } catch (error) {
//       res.status(500).json({ message: 'Server error', error });
//     }
//   };




exports.getImages = async (req, res) => {
  try {
    const images = await Image.find();
    
    // إضافة الحقول المطلوبة لكل صورة
    const imagesWithPrices = images.map(image => ({
      ...image.toObject(),
      originalPrice: image.price / (1 - (image.discount?.percentage || 0) / 100),
      discountedPrice: image.price
    }));
    
    res.status(200).json(imagesWithPrices);
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

    // حساب السعر الأصلي بناءً على السعر المخفض ونسبة الخصم
    const originalPrice = item.price / (1 - (item.discount?.percentage || 0) / 100);
    
    res.status(200).json({
      ...item.toObject(),
      originalPrice,
      discountedPrice: item.price
    });
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
        return res.status(500).json({ message: "Image upload failed" });
      }
  
      const { id } = req.params;
      const { 
        name, 
        price, 
        quantity,
        discountPercentage,
        discountStartDate,
        discountEndDate
      } = req.body;
  
      const imageUrl = req.file?.path;
  
      try {
        const updateData = { name, price, quantity };
        if (imageUrl) updateData.imageUrl = imageUrl;
  

        // if (discountPercentage !== undefined) {
        //   updateData.discount = discountPercentage > 0 ? {
        //     percentage: discountPercentage,
        //     startDate: discountStartDate || new Date(),
        //     endDate: discountEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        //   } : null;
        // }
  
        const updatedImage = await Image.findByIdAndUpdate(
          id,
          updateData,
          { new: true }
        );
       
  
        if (!updatedImage) {
          return res.status(404).json({ message: 'Item not found' });
        }


         if (updatedImage.quantity <= 12) {
            await logActivity('stock_updated', req.user._id, {
                productName: updatedImage.name,
                newQuantity: updatedImage.quantity
            });

            // إرسال إشعار للمتجر إذا كان البائع
            if (req.user.isSeller && req.user.managedRestaurant) {
                await createNotification(
                    req.user._id,
                    req.user.managedRestaurant,
                    'stock',
                    'Low Stock Alert',
                    `${updatedImage.name} quantity is low (${updatedImage.quantity} remaining)`,
                    updatedImage._id
                );
            }
        }

       
        // await logActivity('stock_updated', req.user._id, {
        //   productName: updatedImage.name,
        //   newQuantity: quantity
        // });
      

  
        res.status(200).json({
          message: 'Item updated successfully',
          item: updatedImage
        });
      } catch (error) {
        res.status(500).json({ message: 'Server error' });
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



// exports.getItemDetails = async (req, res) => {
//   const { id } = req.body; 

//   try {
      
//       const item = await Image.findById(id);
//       if (!item) {
//           return res.status(404).json({ message: 'Item not found' });
//       }

     
//       res.status(200).json(item);
//   } catch (error) {
//       res.status(500).json({ message: 'Server error', error });
//   }
// };



exports.getItemsSummary = async (req, res) => {
  try {
      const items = await Image.find({}, 'name quantity price imageUrl'); // Fetch only the required fields
      res.status(200).json(items);
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
};