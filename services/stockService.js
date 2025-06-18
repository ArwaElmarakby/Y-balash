const Image = require('../models/imageModel');
const { createNotification } = require('../controllers/notificationController');

const LOW_STOCK_THRESHOLD = 12;

exports.checkStockUpdates = async (sellerId, restaurantId) => {
  try {
    // تحقق من المنتجات التي أصبحت منخفضة المخزون
    const lowStockItems = await Image.find({
      restaurant: restaurantId,
      quantity: { $lte: LOW_STOCK_THRESHOLD },
      $or: [
        { lastStockStatus: { $exists: false } },
        { lastStockStatus: null },
        { lastStockStatus: 'in' }
      ]
    });

    for (const item of lowStockItems) {
      await createNotification(
        sellerId,
        restaurantId,
        'stock',
        'Low Stock Alert',
        `${item.name} is low on stock (${item.quantity} remaining)`,
        item._id
      );
      
      item.lastStockStatus = 'out';
      await item.save();
    }

    // تحقق من المنتجات التي عادت للمخزون
    const restockedItems = await Image.find({
      restaurant: restaurantId,
      quantity: { $gt: LOW_STOCK_THRESHOLD },
      lastStockStatus: 'out'
    });

    for (const item of restockedItems) {
      await createNotification(
        sellerId,
        restaurantId,
        'stock',
        'Stock Replenished',
        `${item.name} is back in stock (${item.quantity} available)`,
        item._id
      );
      
      item.lastStockStatus = 'in';
      await item.save();
    }

    return {
      lowStockCount: lowStockItems.length,
      restockedCount: restockedItems.length
    };
  } catch (error) {
    console.error('Error checking stock updates:', error);
    throw error;
  }
};