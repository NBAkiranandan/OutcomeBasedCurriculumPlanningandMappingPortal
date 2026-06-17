import Notification from '../models/Notification.js';

export const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('[Notification Service] Error creating notification:', error.message);
  }
};
