// const Activity = require('../models/activityModel');
// const User = require('../models/userModel');

// exports.logActivity = async (actionType, performedById, details) => {
//     try {
//         const activity = new Activity({
//             actionType,
//             performedBy: performedById,
//             details
//         });
//         await activity.save();
//         return activity;
//     } catch (error) {
//         console.error('Error logging activity:', error);
//         return null;
//     }
// };

// exports.getRecentActivities = async (req, res) => {
//     try {
//         const activities = await Activity.find()
//             .sort({ timestamp: -1 })
//             .limit(10)
//             .populate('performedBy', 'email');

//         const formattedActivities = activities.map(activity => {
//             let actionText, detailsText;
            
//             switch(activity.actionType) {
//                 case 'product_added':
//                     actionText = 'Product Added';
//                     detailsText = `Added product: ${activity.details.productName}`;
//                     break;
//                 case 'order_placed':
//                     actionText = 'Order Placed';
//                     detailsText = `Order ID: ${activity.details.orderId}, Amount: ${activity.details.amount} EGP`;
//                     break;
//                 case 'stock_updated':
//                     actionText = 'Stock Updated';
//                     detailsText = `Updated stock for: ${activity.details.productName}, New quantity: ${activity.details.newQuantity}`;
//                     break;
//                 case 'new_seller':
//                     actionText = 'New Seller';
//                     detailsText = `Seller registration approved for: ${activity.details.sellerEmail}`;
//                     break;
//                 case 'order_cancelled':
//                     actionText = 'Order Cancelled';
//                     detailsText = `Cancelled Order ID: ${activity.details.orderId}`;
//                     break;
//                 default:
//                     detailsText = 'Activity performed';
//             }

//             return {
//                 id: activity._id,
//                 action: actionText,
//                 performedBy: activity.performedBy.email,
//                 details: detailsText,
//                 time: getTimeAgo(activity.timestamp)
//             };
//         });

//         res.status(200).json({
//             success: true,
//             count: formattedActivities.length,
//             activities: formattedActivities
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch activities',
//             error: error.message
//         });
//     }
// };

// function getTimeAgo(date) {
//     const seconds = Math.floor((new Date() - date) / 1000);
    
//     let interval = Math.floor(seconds / 31536000);
//     if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
    
//     interval = Math.floor(seconds / 2592000);
//     if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
    
//     interval = Math.floor(seconds / 86400);
//     if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
    
//     interval = Math.floor(seconds / 3600);
//     if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    
//     interval = Math.floor(seconds / 60);
//     if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    
//     return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
// }




const Activity = require('../models/activityModel');
const User = require('../models/userModel');

exports.logActivity = async (actionType, performedById, details) => {
    try {
        const activity = new Activity({
            actionType,
            performedBy: performedById,
            details
        });
        await activity.save();
        return activity;
    } catch (error) {
        console.error('Error logging activity:', error);
        return null;
    }
};

exports.getRecentActivities = async (req, res) => {
    try {
        const activities = await Activity.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('performedBy', 'email');

        const formattedActivities = activities.map(activity => {
            let actionText, detailsText;
            
            switch(activity.actionType) {
                case 'product_added':
                    actionText = 'Product Added';
                    detailsText = `Added product: ${activity.details.productName}`;
                    break;
                case 'order_placed':
                    actionText = 'Order Placed';
                    detailsText = `Order ID: ${activity.details.orderId}, Amount: ${activity.details.amount} EGP`;
                    break;
                case 'stock_updated':
                    actionText = 'Stock Updated';
                    detailsText = `Updated stock for: ${activity.details.productName}, New quantity: ${activity.details.newQuantity}`;
                    break;
                case 'new_seller':
                    actionText = 'New Seller';
                    detailsText = `Seller registration approved for: ${activity.details.sellerEmail}`;
                    break;
                case 'order_cancelled':
                    actionText = 'Order Cancelled';
                    detailsText = `Cancelled Order ID: ${activity.details.orderId}`;
                    break;
                default:
                    detailsText = 'Activity performed';
            }

            return {
                id: activity._id,
                action: actionText,
                performedBy: activity.performedBy.email,
                details: detailsText,
                time: getTimeAgo(activity.timestamp)
            };
        });

        res.status(200).json({
            success: true,
            count: formattedActivities.length,
            activities: formattedActivities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activities',
            error: error.message
        });
    }
};

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    
    return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
}
