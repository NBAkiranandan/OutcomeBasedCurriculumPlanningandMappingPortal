import mongoose from 'mongoose';

const lifecycleHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'LOCKED', 'ARCHIVED'],
    required: true
  },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  changedByName: { type: String, default: 'System' },
  changedByRole: { type: String, default: '' },
  changedAt: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
}, { _id: false });

const curriculumBookReviewSchema = new mongoose.Schema({
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Published', 'Archived', 'Unlocked'],
    default: 'Draft'
  },
  remarks: { type: String, default: '' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  submittedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  publishedAt: { type: Date, default: null },
  returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  returnedAt: { type: Date, default: null },
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  archivedAt: { type: Date, default: null },
  unlockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  unlockedAt: { type: Date, default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const RegulationSchema = new mongoose.Schema({
  code: { type: String, required: true }, // e.g. "R23", "R25"
  academicYear: { type: Number, required: true }, // e.g. 2023, 2025
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  durationYears: { type: Number, required: true, default: 4 }, // Duration of course in years
  semesterCount: { type: Number, required: true, default: 8 }, // Number of semesters

  // === LIFECYCLE STATUS ===
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'LOCKED', 'ARCHIVED'],
    default: 'DRAFT'
  },

  // === LIFECYCLE TRACKING FIELDS ===
  activatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  activatedAt: { type: Date, default: null },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lockedAt: { type: Date, default: null },
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  archivedAt: { type: Date, default: null },

  // === EMBEDDED LIFECYCLE HISTORY ===
  lifecycleHistory: [lifecycleHistorySchema],

  version: { type: Number, default: 1 },

  // CODEx-added start: Stores regulation-specific curriculum book layout overrides.
  curriculumLayout: {
    coverTitle: { type: String, default: '' },
    coverSubtitle: { type: String, default: '' },
    headerText: { type: String, default: '' },
    footerText: { type: String, default: '' },
    watermarkText: { type: String, default: '' },
    pageBorderStyle: { type: String, enum: ['classic', 'minimal', 'none'], default: 'classic' },
    accentColor: { type: String, default: '#1d4ed8' }
  },
  // CODEx-added end
  curriculumBookReviews: [curriculumBookReviewSchema],
  outcomes: [{
    name: { type: String, required: true },
    isGlobal: { type: Boolean, default: false },
    isLocal: { type: Boolean, default: false },
    isMapped: { type: Boolean, default: false },
    items: [{
      code: { type: String, required: true },
      description: { type: String, required: true }
    }]
  }],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, { timestamps: true });

// Ensure unique regulation code per program
RegulationSchema.index({ code: 1, programId: 1 }, { unique: true });

export default mongoose.model('Regulation', RegulationSchema);
