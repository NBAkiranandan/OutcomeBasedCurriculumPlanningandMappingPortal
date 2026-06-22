import MinorStream from '../models/MinorStream.js';
import AuditLog from '../models/AuditLog.js';

export const getMinorStreams = async (req, res, next) => {
  try {
    const { departmentId, regulationId } = req.query;
    const filter = { isDeleted: { $ne: true } };
    if (req.user.role === 'HOD') {
      filter.departmentId = req.user.departmentId;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }
    if (regulationId) filter.regulationId = regulationId;
    
    const streams = await MinorStream.find(filter)
      .populate('courses')
      .populate('departmentId')
      .populate('regulationId');
      
    return res.status(200).json({ streams });
  } catch (error) {
    return next(error);
  }
};

export const createMinorStream = async (req, res, next) => {
  try {
    const { streamCode, name, description, requiredCredits, status, departmentId, regulationId, courses } = req.body;
    let targetDeptId = departmentId;
    if (req.user.role === 'HOD') {
      targetDeptId = req.user.departmentId;
    }
    
    const newStream = new MinorStream({
      streamCode,
      name,
      description,
      requiredCredits: requiredCredits || 18,
      status: status || 'Draft',
      departmentId: targetDeptId,
      regulationId,
      courses: courses || [],
      created_by: req.user.id
    });
    
    await newStream.save();
    
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'CREATE_MINOR_STREAM',
      details: `Created minor stream ${streamCode} - ${name}`,
      category: 'Academic'
    });
    
    return res.status(201).json({ stream: newStream, message: 'Minor stream created successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateMinorStream = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { streamCode, name, description, requiredCredits, status, courses } = req.body;
    
    const stream = await MinorStream.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!stream) return res.status(404).json({ message: 'Minor stream not found.' });

    if (req.user.role === 'HOD' && stream.departmentId.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only edit minor streams of your own department.' });
    }
    
    if (streamCode !== undefined) stream.streamCode = streamCode;
    if (name !== undefined) stream.name = name;
    if (description !== undefined) stream.description = description;
    if (requiredCredits !== undefined) stream.requiredCredits = requiredCredits;
    if (status !== undefined) stream.status = status;
    if (courses !== undefined) stream.courses = courses;
    stream.updated_by = req.user.id;
    
    await stream.save();
    
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'UPDATE_MINOR_STREAM',
      details: `Updated minor stream ${stream.name}`,
      category: 'Academic'
    });
    
    return res.status(200).json({ stream, message: 'Minor stream updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

export const deleteMinorStream = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stream = await MinorStream.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!stream) return res.status(404).json({ message: 'Minor stream not found.' });

    if (req.user.role === 'HOD' && stream.departmentId.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only delete minor streams of your own department.' });
    }

    stream.isDeleted = true;
    stream.deletedAt = new Date();
    await stream.save();
    
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DELETE_MINOR_STREAM',
      details: `Soft-deleted minor stream ${stream.name}`,
      category: 'Academic'
    });
    
    return res.status(200).json({ message: 'Minor stream deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};
