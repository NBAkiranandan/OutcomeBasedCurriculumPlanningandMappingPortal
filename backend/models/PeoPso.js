import mongoose from 'mongoose';

const ObjectiveOutcomeSchema = new mongoose.Schema({
  code: { type: String, required: true }, // PEO1, PEO2, PSO1, PO1, etc.
  description: { type: String, required: true }
});

const PeoPsoSchema = new mongoose.Schema({
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, unique: true },
  peos: [ObjectiveOutcomeSchema],
  psos: [ObjectiveOutcomeSchema],
  pos: [ObjectiveOutcomeSchema] // Standard PO1-PO12 descriptions
}, { timestamps: true });

export default mongoose.model('PeoPso', PeoPsoSchema);
