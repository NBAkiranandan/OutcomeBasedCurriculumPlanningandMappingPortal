import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName: { type: String, default: 'System' },
  userEmail: { type: String, default: '' },
  action: { type: String, required: true }, // e.g. "USER_LOGIN", "CLONE_REGULATION"
  details: { type: String, required: true }, // detailed summary of action
  ipAddress: { type: String, default: '' },
  category: { type: String, enum: ['Security', 'Academic', 'Configuration', 'Workflow'], default: 'Academic' }
}, { timestamps: true });

export default mongoose.model('AuditLog', AuditLogSchema);
