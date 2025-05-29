// controllers/clientAddressController.js
const ClientAddress = require('../models/clientAddressModel');


exports.createAddress = async (req, res) => {
  try {
    const { fullAddress, city, area, nearbyLandmark, label, isDefault } = req.body;
    
    if (!fullAddress || !city || !area) {
      return res.status(400).json({ 
        success: false,
        message: 'The full address, city, and region are required.' 
      });
    }

    if (isDefault) {
      await ClientAddress.updateMany(
        { userId: req.user._id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const newAddress = new ClientAddress({
      userId: req.user._id,
      fullAddress,
      city,
      area,
      nearbyLandmark,
      label,
      isDefault: isDefault || false
    });

    await newAddress.save();

    res.status(201).json({
      success: true,
      message: 'The address has been added successfully.',
      address: newAddress
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred on the server',
      error: error.message
    });
  }
};


exports.getUserAddresses = async (req, res) => {
  try {
    const addresses = await ClientAddress.find({ userId: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: addresses.length,
      addresses
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred on the server',
      error: error.message
    });
  }
};


exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullAddress, city, area, nearbyLandmark, label, isDefault } = req.body;

    const address = await ClientAddress.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'العنوان غير موجود'
      });
    }

    
    if (isDefault) {
      await ClientAddress.updateMany(
        { userId: req.user._id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    address.fullAddress = fullAddress || address.fullAddress;
    address.city = city || address.city;
    address.area = area || address.area;
    address.nearbyLandmark = nearbyLandmark || address.nearbyLandmark;
    address.label = label || address.label;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await address.save();

    res.status(200).json({
      success: true,
      message: 'The address has been updated successfully.',
      address
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred on the server',
      error: error.message
    });
  }
};


exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await ClientAddress.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'The address does not exist'
      });
    }


    if (address.isDefault) {
      const anyAddress = await ClientAddress.findOne({ userId: req.user._id });
      if (anyAddress) {
        anyAddress.isDefault = true;
        await anyAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'The address has been successfully deleted.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred on the server',
      error: error.message
    });
  }
};


exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;


    await ClientAddress.updateMany(
      { userId: req.user._id, isDefault: true },
      { $set: { isDefault: false } }
    );


    const address = await ClientAddress.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { isDefault: true } },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'The address does not exist'
      });
    }

    res.status(200).json({
      success: true,
      message: 'The default address has been set successfully',
      address
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred on the server',
      error: error.message
    });
  }
};