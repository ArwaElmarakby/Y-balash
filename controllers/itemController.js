const Item = require('../models/itemModel');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const upload = multer({ storage: storage });

exports.uploadImage = upload.single('image');

exports.addItem = async (req, res) => {
    try {
        const { name, price, quantity } = req.body;
        const image = req.file.path;

        const item = new Item({ name, price, quantity, image });
        await item.save();

        res.status(201).json({ message: 'Item added successfully', item });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { name, price, quantity } = req.body;
        const image = req.file ? req.file.path : null;

        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        item.name = name || item.name;
        item.price = price || item.price;
        item.quantity = quantity || item.quantity;
        item.image = image || item.image;

        await item.save();

        res.status(200).json({ message: 'Item updated successfully', item });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await item.remove();

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getItems = async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json({ items });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};