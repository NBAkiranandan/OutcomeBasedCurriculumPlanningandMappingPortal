import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Computer Science & Engineering"
  code: { type: String, required: true }, // e.g. "CSE"
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  regulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Regulation', required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// A department code should be unique globally
DepartmentSchema.index({ code: 1 }, { unique: true });

export default mongoose.model('Department', DepartmentSchema);
