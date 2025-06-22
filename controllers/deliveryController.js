
// const Address = require('../models/addressModel');

// // Add a new address for a user
// exports.addAddress = async (req, res) => {
//     const { street, city, state, postalCode, country } = req.body;
//     const userId = req.user._id; // Get user ID from the request

//     try {
//         const newAddress = new Address({ userId, street, city, state, postalCode, country });
//         await newAddress.save();
//         res.status(201).json({ message: 'Address added successfully', address: newAddress });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

// // Get all addresses for a user
// exports.getAddresses = async (req, res) => {
//     const userId = req.user._id;

//     try {
//         const addresses = await Address.find({ userId });
//         res.status(200).json(addresses);
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

// // Update an address
// exports.updateAddress = async (req, res) => {
//     const { addressId } = req.params;
//     const { street, city, state, postalCode, country } = req.body;

//     try {
//         const updatedAddress = await Address.findByIdAndUpdate(
//             addressId,
//             { street, city, state, postalCode, country },
//             { new: true }
//         );

//         if (!updatedAddress) {
//             return res.status(404).json({ message: 'Address not found' });
//         }

//         res.status(200).json({ message: 'Address updated successfully', address: updatedAddress });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

// // Delete an address
// exports.deleteAddress = async (req, res) => {
//     const { addressId } = req.params;

//     try {
//         const address = await Address.findByIdAndDelete(addressId);
//         if (!address) {
//             return res.status(404).json({ message: 'Address not found' });
//         }

//         res.status(200).json({ message: 'Address deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };




const Address = require('../models/addressModel');

exports.addAddress = async (req, res) => {
  const {
    country,
    fullName,
    mobileNumber,
    streetName,
    buildingNameNo,
    cityArea,
    governorate,
    nearestLandmark
  } = req.body;


  if (!country || !fullName || !mobileNumber || !streetName || !buildingNameNo || !cityArea || !governorate) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  try {
    const newAddress = new Address({
      userId: req.user._id, 
      country,
      fullName,
      mobileNumber,
      streetName,
      buildingNameNo,
      cityArea,
      governorate,
      nearestLandmark
    });

    await newAddress.save();
    res.status(201).json({ message: 'Address added successfully', address: newAddress });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



exports.getUserAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id }); 
    if (!addresses || addresses.length === 0) {
      return res.status(404).json({ message: 'No addresses found for this user' });
    }
    res.status(200).json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



exports.updateAddress = async (req, res) => {
  const { addressId } = req.params; 
  const {
    country,
    fullName,
    mobileNumber,
    streetName,
    buildingNameNo,
    cityArea,
    governorate,
    nearestLandmark
  } = req.body;

  try {

    const address = await Address.findOne({
      _id: addressId,
      userId: req.user._id 
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found or not owned by user' });
    }

    
    address.country = country || address.country;
    address.fullName = fullName || address.fullName;
    address.mobileNumber = mobileNumber || address.mobileNumber;
    address.streetName = streetName || address.streetName;
    address.buildingNameNo = buildingNameNo || address.buildingNameNo;
    address.cityArea = cityArea || address.cityArea;
    address.governorate = governorate || address.governorate;
    address.nearestLandmark = nearestLandmark || address.nearestLandmark;

    await address.save(); 

    res.status(200).json({ message: 'Address updated successfully', address });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



exports.deleteAddress = async (req, res) => {
  const { addressId } = req.params; 

  try {

    const deletedAddress = await Address.findOneAndDelete({
      _id: addressId,
      userId: req.user._id 
    });

    if (!deletedAddress) {
      return res.status(404).json({ message: 'Address not found or not owned by user' });
    }

    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};




exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id });
    
    if (!addresses || addresses.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No addresses found for this user' 
      });
    }
    
    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};