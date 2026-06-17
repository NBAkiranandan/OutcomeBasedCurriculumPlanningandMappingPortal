import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true }, // e.g. "CS203"
  title: { type: String, required: true }, // e.g. "Database Management Systems"
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('Course', CourseSchema);
