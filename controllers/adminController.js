const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');


exports.assignSellerToRestaurant = async (req, res) => {
    const { userId, restaurantId } = req.body;

    try {

        const user = await User.findById(userId);
        const restaurant = await Restaurant.findById(restaurantId);

        if (!user || !restaurant) {
            return res.status(404).json({ message: 'User or restaurant not found' });
        }


        user.isSeller = true;
        user.managedRestaurant = restaurantId;
        await user.save();

        res.status(200).json({ 
            message: 'Seller assigned to restaurant successfully',
            user: {
                _id: user._id,
                email: user.email,
                managedRestaurant: restaurant.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


exports.getAllSellers = async (req, res) => {
    try {
        const sellers = await User.find({ isSeller: true })
            .populate('managedRestaurant', 'name');

        res.status(200).json(sellers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};




exports.approveSeller = async (req, res) => {
    const { email, username, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User  not found' });
        }
        user.isSeller = true;
        user.username = username; 
        user.password = password; 
        await user.save();
        res.status(200).json({ message: 'Seller approved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};