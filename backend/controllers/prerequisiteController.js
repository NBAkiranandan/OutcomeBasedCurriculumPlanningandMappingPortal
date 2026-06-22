import PrerequisiteLink from '../models/PrerequisiteLink.js';
import AuditLog from '../models/AuditLog.js';

export const getPrerequisites = async (req, res, next) => {
  try {
    const { regulationId } = req.query;
    const filter = { isDeleted: { $ne: true } };
    if (regulationId) filter.regulationId = regulationId;
    
    const links = await PrerequisiteLink.find(filter)
      .populate('sourceCourseId')
      .populate('targetCourseId');
      
    return res.status(200).json({ links });
  } catch (error) {
    return next(error);
  }
};

export const createPrerequisite = async (req, res, next) => {
  try {
    const { sourceCourseId, targetCourseId, regulationId } = req.body;
    
    if (sourceCourseId === targetCourseId) {
      return res.status(400).json({ message: 'A course cannot be a prerequisite of itself.' });
    }

    if (req.user.role === 'HOD') {
      const Regulation = (await import('../models/Regulation.js')).default;
      const reg = await Regulation.findById(regulationId);
      if (!reg || (reg.programId && reg.programId.toString() !== req.user.programId.toString())) {
        return res.status(403).json({ message: 'Forbidden: You can only add prerequisites to regulations of your own program.' });
      }
    }
    
    const newLink = new PrerequisiteLink({
      sourceCourseId,
      targetCourseId,
      regulationId
    });
    
    await newLink.save();
    
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'CREATE_PREREQUISITE',
      details: `Created prerequisite link from ${sourceCourseId} to ${targetCourseId}`,
      category: 'Academic'
    });
    
    return res.status(201).json({ link: newLink, message: 'Prerequisite link created successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deletePrerequisite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const link = await PrerequisiteLink.findOne({ _id: id, isDeleted: { $ne: true } }).populate('regulationId');
    if (!link) return res.status(404).json({ message: 'Prerequisite link not found.' });

    if (req.user.role === 'HOD' && link.regulationId?.programId && link.regulationId.programId.toString() !== req.user.programId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only delete prerequisite links of your own program.' });
    }

    link.isDeleted = true;
    link.deletedAt = new Date();
    await link.save();
    
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DELETE_PREREQUISITE',
      details: `Soft-deleted prerequisite link ID ${id}`,
      category: 'Academic'
    });
    
    return res.status(200).json({ message: 'Prerequisite link deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};
