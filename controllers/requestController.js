const Request = require('../models/requestModel'); 
exports.getPendingRequests = async (req, res) => {
    try {
        const pendingRequests = await Request.find({ status: 'pending' }); 
        res.status(200).json({
            success: true,
            count: pendingRequests.length,
            pendingRequests
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error fetching pending requests',
            error: error.message 
        });
    }
};