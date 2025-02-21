const Restaurant = require('../models/restaurantModel');


exports.addRestaurant = async (req, res) => {
    const { name, imageUrl, description } = req.body;

    try {
        const newRestaurant = new Restaurant({ name, imageUrl, description });
        await newRestaurant.save();
        res.status(201).json({ message: 'Restaurant added successfully', restaurant: newRestaurant });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
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
    const { id } = req.params;
    const { name, imageUrl, description } = req.body;

    try {
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            id,
            { name, imageUrl, description },
            { new: true } 
        );

        if (!updatedRestaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        res.status(200).json({ message: 'Restaurant updated successfully', restaurant: updatedRestaurant });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
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