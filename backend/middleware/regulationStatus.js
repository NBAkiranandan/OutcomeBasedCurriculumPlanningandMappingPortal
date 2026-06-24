import Regulation from '../models/Regulation.js';

/**
 * Middleware factory — ensures the target regulation is in one of the allowed statuses.
 * Attach to any write route that should be blocked when a regulation is LOCKED or ARCHIVED.
 *
 * Usage:
 *   router.post('/courses', requireRegulationEditable(), courseController.createCourse);
 *   // or with a custom param name:
 *   router.put('/peo-pso/:id', requireRegulationEditable('regulationId'), ...);
 *
 * @param {string} bodyField   - field in req.body containing the regulationId (default: 'regulationId')
 * @param {string[]} allowed   - statuses that are allowed to proceed (default: ['DRAFT', 'ACTIVE'])
 */
export const requireRegulationEditable = (bodyField = 'regulationId', allowed = ['DRAFT', 'ACTIVE']) => {
  return async (req, res, next) => {
    // Admin users bypass all lifecycle restrictions
    if (req.user && req.user.role === 'Admin') return next();

    const regulationId = req.body[bodyField] || req.params.regulationId || req.query.regulationId;

    if (!regulationId) {
      // No regulation ID found — let the downstream handler deal with missing data
      return next();
    }

    try {
      const reg = await Regulation.findOne({ _id: regulationId, isDeleted: { $ne: true } }).lean();

      if (!reg) {
        return res.status(404).json({ message: 'Regulation not found.' });
      }

      const currentStatus = reg.status || 'DRAFT';

      if (!allowed.includes(currentStatus)) {
        const statusLabel = currentStatus === 'LOCKED' ? 'LOCKED 🔒' : 'ARCHIVED 📦';
        return res.status(423).json({
          message: `Regulation "${reg.code}" is currently ${statusLabel}. Modifications are not permitted. Contact the System Administrator to request changes.`,
          regulationStatus: currentStatus,
          regulationCode: reg.code
        });
      }

      // Attach regulation to request for downstream use
      req.regulation = reg;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Middleware to check a regulation referenced via URL param (:regulationId or :id).
 * Use this for GET routes that need to show locked status information.
 */
export const loadRegulationStatus = async (req, res, next) => {
  const regulationId = req.params.regulationId || req.params.id || req.query.regulationId;
  if (!regulationId) return next();

  try {
    const reg = await Regulation.findOne({ _id: regulationId, isDeleted: { $ne: true } })
      .select('status code')
      .lean();
    if (reg) {
      req.regulationStatus = reg.status;
      req.regulationCode = reg.code;
    }
    next();
  } catch (err) {
    next(err);
  }
};
