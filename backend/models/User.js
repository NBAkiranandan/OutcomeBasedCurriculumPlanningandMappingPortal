import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'HOD', 'Coordinator', 'Faculty'], 
    default: 'Faculty' 
  },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String, default: null }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
