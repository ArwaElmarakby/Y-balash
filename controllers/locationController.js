// controllers/locationController.js
const Location = require('../models/locationModel');

exports.setLocation = async (req, res) => {
    const { latitude, longitude } = req.body; 
    const userId = req.user.id; 

    try {
       
        const newLocation = new Location({ userId, latitude, longitude });
        await newLocation.save();

        res.status(201).json({ message: 'Location saved successfully', location: newLocation });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};