// controllers/locationController.js
const Location = require('../models/locationModel');


exports.setLocation = async (req, res) => {
    const { latitude, longitude, address } = req.body; 
    const userId = req.user.id; 

    try {
        
        const newLocation = new Location({ userId, latitude, longitude, address });
        await newLocation.save();

        res.status(201).json({ message: 'Location saved successfully', location: newLocation });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


exports.getMapData = async (req, res) => {
    try {
        res.status(200).json({
            mapApiKey: process.env.GOOGLE_MAPS_API_KEY, 
            defaultLocation: {
                latitude: 30.0444, 
                longitude: 31.2357, 
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};