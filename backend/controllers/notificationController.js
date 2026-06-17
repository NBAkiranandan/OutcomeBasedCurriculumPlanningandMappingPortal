import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build base query to fetch user-specific or role-wide notifications
    const query = {
      $or: [
        { recipientId: userId },
        { recipientRole: userRole }
      ]
    };

    // Category filter
    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    // Course filter
    if (req.query.courseId) {
      query.courseId = req.query.courseId;
    }

    // Search filter
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      // Override the query to ensure the recipient checks are combined with the search criteria
      query.$and = [
        {
          $or: [
            { recipientId: userId },
            { recipientRole: userRole }
          ]
        },
        {
          $or: [
            { title: searchRegex },
            { description: searchRegex }
          ]
        }
      ];
      delete query.$or;
    }

    // Pagination/Lazy Loading
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .populate('courseId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const unreadQuery = {
      $or: [
        { recipientId: userId },
        { recipientRole: userRole }
      ],
      isRead: false
    };
    const unreadCount = await Notification.countDocuments(unreadQuery);

    return res.status(200).json({
      notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    return next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    // Check permissions
    const isOwner = notification.recipientId && notification.recipientId.toString() === userId;
    const hasRole = notification.recipientRole && notification.recipientRole === userRole;

    if (!isOwner && !hasRole) {
      return res.status(403).json({ message: 'Unauthorized to modify this notification.' });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ notification, message: 'Notification marked as read.' });
  } catch (error) {
    return next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = {
      $or: [
        { recipientId: userId },
        { recipientRole: userRole }
      ],
      isRead: false
    };

    await Notification.updateMany(query, { $set: { isRead: true } });

    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    return next(error);
  }
};
