import mongoose from 'mongoose';

const ObjectiveOutcomeSchema = new mongoose.Schema({
  code: { type: String, required: true }, // PEO1, PEO2, PSO1, PO1, etc.
  description: { type: String, required: true }
});

const PeoPsoSchema = new mongoose.Schema({
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  regulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Regulation' },
  peos: [ObjectiveOutcomeSchema],
  psos: [ObjectiveOutcomeSchema],
  pos: [ObjectiveOutcomeSchema], // Standard PO1-PO12 descriptions
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: true });

// Compound index for uniqueness of PEO/PSO matrices per department and regulation
PeoPsoSchema.index({ departmentId: 1, regulationId: 1 }, { unique: true });

export default mongoose.model('PeoPso', PeoPsoSchema);
