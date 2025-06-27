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

    const { name, description } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Get Cloudinary image URL

    if (!name || !imageUrl) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const newCategory = new Category({ name, imageUrl, description: description || "" });
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



// exports.getCategoryItems = async (req, res) => {
//   const { categoryId } = req.body; 

//   try {
//     const category = await Category.findById(categoryId).populate('items');
//     if (!category) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     res.status(200).json(category.items);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error });
//   }
// };


// exports.getCategoryItems = async (req, res) => {
//   const { categoryId } = req.body; 

//   try {
//     const category = await Category.findById(categoryId).populate({
//       path: 'items',
//       transform: (doc) => {
//         if (doc && doc.discount) {
//           const originalPrice = parseFloat(doc.price);
//           const discountPercentage = doc.discount.percentage;
//           const discountedPrice = (originalPrice * (1 - discountPercentage / 100)).toFixed(2);
          
//           return {
//             ...doc.toObject(),
//             originalPrice: originalPrice.toFixed(2),
//             discountedPrice
//           };
//         }
//         return doc;
//       }
//     });
    
//     if (!category) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     res.status(200).json(category.items);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error });
//   }
// };




// exports.getCategoryItems = async (req, res) => {
//   const { categoryId } = req.body; 

//   try {
//     const category = await Category.findById(categoryId).populate({
//       path: 'items',
//       transform: (doc) => {
//         if (doc && doc.discount) {
//           const originalPrice = parseFloat(doc.price);
//           const discountPercentage = doc.discount.percentage;
          

//           const discountedPrice = (originalPrice * (1 - discountPercentage / 100));
          

//           const formatPrice = (num) => parseFloat(num.toFixed(2));
          
//           return {
//             ...doc.toObject(),
//             originalPrice: formatPrice(originalPrice),
//             discountedPrice: formatPrice(discountedPrice)
//           };
//         }
//         return doc;
//       }
//     });
    
//     if (!category) {
//       return res.status(404).json({ message: 'Category not found' });
//     }

//     res.status(200).json(category.items);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error });
//   }
// };


exports.getCategoryItems = async (req, res) => {
  const { categoryId } = req.body;

  try {
    const category = await Category.findById(categoryId).populate({
      path: 'items',
      match: { _id: { $exists: true } }, // تأكد من وجود العنصر في DB
      options: { lean: true }, // تحسين الأداء
      transform: (doc) => {
        if (!doc) return null;
        
        if (doc.discount) {
          const originalPrice = parseFloat(doc.price);
          const discountedPrice = originalPrice * (1 - doc.discount.percentage / 100);
          
          return {
            ...doc,
            originalPrice: parseFloat(originalPrice.toFixed(2)),
            discountedPrice: parseFloat(discountedPrice.toFixed(2))
          };
        }
        return doc;
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // تصفية جميع القيم null والمكررة
    const uniqueItems = category.items
      .filter(item => item !== null)
      .filter((item, index, self) => 
        self.findIndex(i => i._id.toString() === item._id.toString()) === index
      );

    res.status(200).json(uniqueItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


// exports.removeItemFromCategory = async (req, res) => {
//   const { categoryId, itemId } = req.body;

//   try {

//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res.status(404).json({ message: 'Category not found' });
//     }


//     const item = await Image.findById(itemId);
//     if (!item) {
//       return res.status(404).json({ message: 'Item not found' });
//     }


//     category.items = category.items.filter(
//       (item) => item.toString() !== itemId
//     );
//     await category.save();


//     item.category = null;
//     await item.save();

//     res.status(200).json({ message: 'Item removed from category successfully', category });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error });
//   }
// };


exports.removeItemFromCategory = async (req, res) => {
  const { categoryId, itemId } = req.body;

  try {
    // حل أكثر قوة باستخدام $pull مباشرة في MongoDB
    await Category.findByIdAndUpdate(
      categoryId,
      { $pull: { items: itemId } },
      { new: true }
    );

    await Image.findByIdAndUpdate(itemId, { $unset: { category: "" } });

    res.status(200).json({ message: 'Item removed successfully' });
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
    const { id } = req.params;
  
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
  
      const { id } = req.params;
      const { name } = req.body;
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


  exports.getTotalCategories = async (req, res) => {
    try {
        const total = await Category.countDocuments();
        res.status(200).json({ totalCategories: total });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};