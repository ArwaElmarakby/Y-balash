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



exports.checkStockChanges = async (sellerId, restaurantId) => {
  try {
    const LOW_STOCK_THRESHOLD = 12;
    
    // الحصول على جميع المنتجات ذات الكمية أقل من الحد الأدنى
    const lowStockItems = await Image.find({
      restaurant: restaurantId,
      quantity: { $lt: LOW_STOCK_THRESHOLD }
    });

    for (const item of lowStockItems) {
      // إرسال إشعار لكل منتج منخفض الكمية
      await createNotification(
        sellerId,
        restaurantId,
        'stock',
        'Low Stock Alert',
        `${item.name} is low on stock (${item.quantity} remaining)`,
        item._id
      );
    }

    return lowStockItems.length;
  } catch (error) {
    console.error('Error checking stock changes:', error);
    return 0;
  }
};