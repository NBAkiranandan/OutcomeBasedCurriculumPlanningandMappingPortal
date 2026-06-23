import mongoose from 'mongoose';

const MinorDegreeCourseSchema = new mongoose.Schema({
  minorDegreeId: { type: mongoose.Schema.Types.ObjectId, ref: 'MinorDegree', required: true },
  courseCode: { type: String, required: true },
  courseName: { type: String, required: true },
  credits: { type: Number, required: true },
  semester: { type: String, required: true }, // e.g., "Semester 4", "Semester 5"
  courseType: { type: String, default: 'PC' },
  orGroupId: { type: String, default: null },
  description: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: true });

MinorDegreeCourseSchema.index({ minorDegreeId: 1, courseCode: 1 }, { unique: true });

export default mongoose.model('MinorDegreeCourse', MinorDegreeCourseSchema);
