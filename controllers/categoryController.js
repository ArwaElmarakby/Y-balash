const Category = require('../models/categoryModel');


exports.addCategory = async (req, res) => {
    const { name, imageUrl } = req.body;

    try {
        const newCategory = new Category({ name, imageUrl });
        await newCategory.save();
        res.status(201).json({ message: 'Category added successfully', category: newCategory });
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
    const { id } = req.params;
    const { name, imageUrl } = req.body;

    try {
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name, imageUrl },
            { new: true } 
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
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