const Notification = require('../models/notificationModel');
const Image = require('../models/imageModel');
const Order = require('../models/orderModel');
const { createNotification } = require('../controllers/notificationController');


exports.checkStockUpdates = async (sellerId, restaurantId) => {
  try {

    const restockedItems = await Image.find({
      restaurant: restaurantId,
      quantity: { $gt: 0 },
      lastStockStatus: 'out' 
    });

    for (const item of restockedItems) {
      await createNotification(
        sellerId,
        restaurantId,
        'stock',
        'Product Restocked',
        `${item.name} is now back in stock (${item.quantity} available)`,
        item._id
      );
      

      item.lastStockStatus = 'in';
      await item.save();
    }


    const outOfStockItems = await Image.find({
      restaurant: restaurantId,
      quantity: 0,
      lastStockStatus: 'in'
    });

    for (const item of outOfStockItems) {
      await createNotification(
        sellerId,
        restaurantId,
        'stock',
        'Product Out of Stock',
        `${item.name} is now out of stock`,
        item._id
      );
      
      item.lastStockStatus = 'out';
      await item.save();
    }
  } catch (error) {
    console.error('Error checking stock updates:', error);
  }
};


exports.checkAnalyticsChanges = async (sellerId, restaurantId, currentStats, previousStats) => {
  try {

    const salesChange = ((currentStats.totalSales - previousStats.totalSales) / previousStats.totalSales) * 100;
    
    if (Math.abs(salesChange) > 30) { 
      await createNotification(
        sellerId,
        restaurantId,
        'analytics',
        'Significant Sales Change',
        `Your sales have ${salesChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(salesChange).toFixed(2)}%`,
        null,
        { change: salesChange }
      );
    }


} catch (error) {
    console.error('Error checking analytics changes:', error);
  }
};


exports.monitorStockLevels = async () => {
    try {
        const sellers = await User.find({ isSeller: true, managedRestaurant: { $exists: true } });
        
        for (const seller of sellers) {
            const lowStockItems = await Image.find({
                restaurant: seller.managedRestaurant,
                quantity: { $lte: 12 } // عتبة 12
            });

            if (lowStockItems.length > 0) {
                await createNotification(
                    seller._id,
                    seller.managedRestaurant,
                    'stock',
                    'Low Stock Items',
                    `You have ${lowStockItems.length} items with low stock`,
                    null,
                    { count: lowStockItems.length }
                );
            }
        }
    } catch (error) {
        console.error('Error monitoring stock levels:', error);
    }
};