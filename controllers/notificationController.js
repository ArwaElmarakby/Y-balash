const Notification = require('../models/notificationModel');
const Image = require('../models/imageModel');
const Order = require('../models/orderModel');


exports.createNotification = async (userId, restaurantId, type, title, message, relatedItem = null, metadata = {}) => {
  try {
    const notification = new Notification({
      userId,
      restaurantId,
      type,
      title,
      message,
      relatedItem,
      metadata
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};


exports.getSellerNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      restaurantId: req.user.managedRestaurant
    })
    .sort({ createdAt: -1 })
    .limit(20);

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.markAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


exports.deleteNotification = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// في notificationController.js
module.exports = {
  createNotification,
  getSellerNotifications,
  markAsRead,
  deleteNotification
};