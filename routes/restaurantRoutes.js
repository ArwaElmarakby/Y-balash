// const express = require('express');
// const router = express.Router();
// const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant, searchRestaurants } = require('../controllers/restaurantController');

// router.post('/add', addRestaurant); 
// router.get('/all', getRestaurants); 
// router.delete('/delete/:id', deleteRestaurant); 
// router.put('/update/:id', updateRestaurant); 
// router.get('/search', searchRestaurants);

// module.exports = router;



const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');  // استخدم middleware لتخزين الصور في Cloudinary
const Restaurant = require('../models/restaurant');  // نموذج المطعم الخاص بك
const { addRestaurant, getRestaurants, deleteRestaurant, updateRestaurant, searchRestaurants } = require('../controllers/restaurantController');

router.post('/add', addRestaurant); 
router.get('/all', getRestaurants); 
router.delete('/delete/:id', deleteRestaurant); 
router.put('/update/:id', updateRestaurant); 
router.get('/search', searchRestaurants);


// Endpoint لإضافة مطعم مع صورة
router.post('/add', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "يرجى رفع صورة للمطعم" });
  }

  // إذا كانت الصورة قد تم رفعها، نقوم بإنشاء مطعم جديد في قاعدة البيانات
  try {
    const newRestaurant = new Restaurant({
      name: req.body.name,  // نأخذ اسم المطعم من body
      imageUrl: req.file.path,  // نأخذ رابط الصورة من Cloudinary
    });

    // حفظ المطعم في قاعدة البيانات
    await newRestaurant.save();

    res.status(200).json({
      message: "تم إضافة المطعم بنجاح",
      restaurant: newRestaurant,  // إرسال تفاصيل المطعم بما في ذلك رابط الصورة
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء إضافة المطعم" });
  }
});

module.exports = router;
