import mongoose from 'mongoose';

const CourseCategorySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g., 'MCC'
  name: { type: String, required: true },               // e.g., 'Major Core Courses (MCC)'
  ugc: { type: String, default: '-' },                  // e.g., '80'
}, { timestamps: true });

export default mongoose.model('CourseCategory', CourseCategorySchema);
