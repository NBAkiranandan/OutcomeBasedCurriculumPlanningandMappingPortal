import mongoose from 'mongoose';

const CourseCategorySchema = new mongoose.Schema({
  code: { type: String, required: true }, // e.g., 'MCC'
  name: { type: String, required: true },               // e.g., 'Major Core Courses (MCC)'
  ugc: { type: String, default: '-' },                  // e.g., '80'
  order: { type: Number, default: 0 },                  // For custom sorting
  regulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Regulation', default: null }, // null = global/shared
}, { timestamps: true });

// Unique per (code, regulationId) — same code can exist across different regulations
CourseCategorySchema.index({ code: 1, regulationId: 1 }, { unique: true });

export default mongoose.model('CourseCategory', CourseCategorySchema);
