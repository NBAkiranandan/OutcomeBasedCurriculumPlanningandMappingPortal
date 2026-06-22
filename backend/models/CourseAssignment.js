import mongoose from 'mongoose';

const CourseAssignmentSchema = new mongoose.Schema({
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  academicYear: { type: Number, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  is_active: { type: Boolean, default: true },
  regulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Regulation' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Prevent duplicate assignments
CourseAssignmentSchema.index({ facultyId: 1, courseId: 1, academicYear: 1, semester: 1, section: 1 }, { unique: true });

export default mongoose.model('CourseAssignment', CourseAssignmentSchema);
