const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

exports.createProduct = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(400).json({ message: err });
        } else {
            const newProduct = new Product({
                name: req.body.name,
                quantity: req.body.quantity,
                price: req.body.price,
                image: req.file ? req.file.filename : ''
            });

            newProduct.save()
                .then(product => res.json(product))
                .catch(err => res.status(400).json({ message: err }));
        }
    });
};