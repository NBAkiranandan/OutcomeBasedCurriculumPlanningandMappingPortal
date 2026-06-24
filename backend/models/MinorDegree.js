import mongoose from 'mongoose';

const MinorDegreeSchema = new mongoose.Schema({
  minorName: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  departmentName: { type: String },
  regulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Regulation', required: true },
  regulationName: { type: String },
  description: { type: String, default: '' },
  requiredCredits: { type: Number, required: true, default: 18 },
  currentCredits: { type: Number, default: 0 },
  eligibility: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: true });

MinorDegreeSchema.index({ minorName: 1, departmentId: 1, regulationId: 1 }, { unique: true });

export default mongoose.model('MinorDegree', MinorDegreeSchema);
