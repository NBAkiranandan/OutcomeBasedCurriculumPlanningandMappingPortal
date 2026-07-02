import mongoose from 'mongoose';

const MinorStreamCourseSchema = new mongoose.Schema({
  minorStreamId: { type: mongoose.Schema.Types.ObjectId, ref: 'MinorStream', required: true },
  courseCode: { type: String, required: true },
  courseName: { type: String, required: true },
  level: { type: Number, default: 1 },
  L: { type: Number, default: 0 },
  T: { type: Number, default: 0 },
  P: { type: Number, default: 0 },
  credits: { type: Number, required: true },
  cie: { type: Number, default: 50 },
  see: { type: Number, default: 50 },
  total: { type: Number, default: 100 },
  prerequisite: { type: String, default: '-' },
  semester: { type: String, required: true },
  courseOrder: { type: Number, default: 0 },
  courseType: { type: String, default: 'MSC' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: true });

MinorStreamCourseSchema.index({ minorStreamId: 1, courseCode: 1 }, { unique: true });

export default mongoose.model('MinorStreamCourse', MinorStreamCourseSchema);
