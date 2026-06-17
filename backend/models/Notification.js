import mongoose from 'mongoose';
import Course from './Course.js';
import User from './User.js';

const NotificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  recipientRole: {
    type: String,
    enum: ['Admin', 'HOD', 'Coordinator', 'Faculty'],
    default: null
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Course Updates', 'Approval Status', 'System'],
    required: true
  },
  type: {
    type: String,
    enum: ['success', 'warning', 'info', 'system'],
    default: 'info'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
