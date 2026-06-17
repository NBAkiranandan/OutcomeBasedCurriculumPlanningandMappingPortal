import mongoose from 'mongoose';

const MinorStreamSchema = new mongoose.Schema({
  streamCode: { type: String, required: true }, // e.g. "MIN-SEC"
  name: { type: String, required: true }, // e.g. "Network Security"
  description: { type: String, default: '' },
  requiredCredits: { type: Number, required: true, default: 18 },
  status: { type: String, enum: ['Draft', 'Active', 'Archived'], default: 'Draft' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  regulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Regulation', required: true },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  is_active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// A minor stream code should be unique per department and regulation
MinorStreamSchema.index({ streamCode: 1, departmentId: 1, regulationId: 1 }, { unique: true });

export default mongoose.model('MinorStream', MinorStreamSchema);
