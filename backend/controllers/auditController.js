import AuditLog from '../models/AuditLog.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { user, module, action, dateFrom, dateTo } = req.query;
    const filter = {};

    if (user) {
      filter.$or = [
        { userName: { $regex: user, $options: 'i' } },
        { userEmail: { $regex: user, $options: 'i' } }
      ];
    }

    if (module) {
      filter.category = module; // Category maps to Module filter
    }

    if (action) {
      filter.action = { $regex: action, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Set to end of the day
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endOfDay;
      }
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200); // safety limit

    return res.status(200).json({ logs });
  } catch (error) {
    return next(error);
  }
};
