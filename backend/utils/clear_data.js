import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Program from '../models/Program.js';
import Department from '../models/Department.js';
import Regulation from '../models/Regulation.js';
import Course from '../models/Course.js';
import CourseVersion from '../models/CourseVersion.js';
import PeoPso from '../models/PeoPso.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/obcpmp';

const clearData = async () => {
  try {
    console.log('[Clear] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Clear] Connected.');

    // Clear all data except users
    console.log('[Clear] Deleting all programs, departments, regulations, courses, etc...');
    await Program.deleteMany({});
    await Department.deleteMany({});
    await Regulation.deleteMany({});
    await Course.deleteMany({});
    await CourseVersion.deleteMany({});
    await PeoPso.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    console.log('[Clear] All non-user collections have been emptied.');

    // Clear all users EXCEPT the 4 seed users
    console.log('[Clear] Removing all non-seed users...');
    const seedEmails = [
      'admin@aditya.edu.in',
      'hod.cse@aditya.edu.in',
      'coord.cse@aditya.edu.in',
      'faculty.cse@aditya.edu.in'
    ];
    await User.deleteMany({ email: { $nin: seedEmails } });
    console.log('[Clear] Non-seed users deleted.');

    console.log('[Clear] Database successfully cleared (only seed users remaining)!');
    process.exit(0);
  } catch (error) {
    console.error(`[Clear Error] Database clearing failed: ${error.message}`);
    process.exit(1);
  }
};

clearData();
