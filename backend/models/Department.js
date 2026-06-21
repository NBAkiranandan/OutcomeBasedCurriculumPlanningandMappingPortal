import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Computer Science & Engineering"
  code: { type: String, required: true }, // e.g. "CSE"
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  outcomes: [{
    name: { type: String, required: true },
    isGlobal: { type: Boolean, default: false },
    isLocal: { type: Boolean, default: false },
    isMapped: { type: Boolean, default: false },
    items: [{
      code: { type: String, required: true },
      description: { type: String, required: true }
    }]
  }]
}, { timestamps: true });

// A department code should be unique globally
DepartmentSchema.index({ code: 1 }, { unique: true });

export default mongoose.model('Department', DepartmentSchema);
