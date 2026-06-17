import mongoose from 'mongoose';

const PrerequisiteLinkSchema = new mongoose.Schema({
  sourceCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // The prerequisite course
  targetCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // The dependent course
  regulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Regulation', required: true }
}, { timestamps: true });

// Unique link per regulation
PrerequisiteLinkSchema.index({ sourceCourseId: 1, targetCourseId: 1, regulationId: 1 }, { unique: true });

export default mongoose.model('PrerequisiteLink', PrerequisiteLinkSchema);
