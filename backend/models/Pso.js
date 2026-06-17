import mongoose from 'mongoose';

const PsoSchema = new mongoose.Schema({
  psoCode: { type: String, required: true }, // e.g. "PSO1"
  description: { type: String, required: true },
  status: { type: String, enum: ['Draft', 'Active', 'Archived'], default: 'Draft' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  is_active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// PSO code should be unique within a department
PsoSchema.index({ psoCode: 1, departmentId: 1 }, { unique: true });

export default mongoose.model('Pso', PsoSchema);
