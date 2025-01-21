const express = require('express');
const router = express.Router();
const Item = require('../models/itemModel');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// تكوين Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// تكوين multer لتخزين الصور في Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'items',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage: storage });

// إضافة عنصر جديد
router.post('/add', upload.single('image'), async (req, res) => {
    const { name, price, quantity } = req.body;
    const image = req.file.path;

    try {
        const newItem = new Item({ name, price, quantity, image });
        await newItem.save();
        res.status(201).json({ message: 'Item added successfully', item: newItem });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// عرض جميع العناصر
router.get('/', async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// تعديل عنصر
router.put('/update/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, price, quantity } = req.body;
    const image = req.file ? req.file.path : undefined;

    try {
        const item = await Item.findById(id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (name) item.name = name;
        if (price) item.price = price;
        if (quantity) item.quantity = quantity;
        if (image) item.image = image;

        await item.save();
        res.status(200).json({ message: 'Item updated successfully', item });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// حذف عنصر
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const item = await Item.findByIdAndDelete(id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;