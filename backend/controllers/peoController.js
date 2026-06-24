import Peo from '../models/Peo.js';
import AuditLog from '../models/AuditLog.js';

export const getPeos = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const filter = { is_active: true, isDeleted: { $ne: true } };
    if (departmentId) filter.departmentId = departmentId;
    
    const peos = await Peo.find(filter).populate('mappedPsos').sort({ peoCode: 1 });
    return res.status(200).json({ peos });
  } catch (error) {
    return next(error);
  }
};

export const createPeo = async (req, res, next) => {
  try {
    const { peoCode, description, status, departmentId, mappedPsos } = req.body;
    
    const newPeo = new Peo({
      peoCode, description, status, departmentId, mappedPsos, created_by: req.user.id
    });
    
    await newPeo.save();
    
    await AuditLog.create({
      userId: req.user.id, userName: req.user.name, userEmail: req.user.email,
      action: 'CREATE_PEO', details: `Created PEO ${peoCode}`, category: 'Academic'
    });
    
    return res.status(201).json({ peo: newPeo, message: 'PEO created successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updatePeo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_by: req.user.id };
    
    const peo = await Peo.findByIdAndUpdate(id, updateData, { new: true });
    if (!peo) return res.status(404).json({ message: 'PEO not found.' });
    
    await AuditLog.create({
      userId: req.user.id, userName: req.user.name, userEmail: req.user.email,
      action: 'UPDATE_PEO', details: `Updated PEO ${peo.peoCode}`, category: 'Academic'
    });
    
    return res.status(200).json({ peo, message: 'PEO updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

export const deletePeo = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Soft delete
    const peo = await Peo.findByIdAndUpdate(id, { is_active: false, updated_by: req.user.id }, { new: true });
    if (!peo) return res.status(404).json({ message: 'PEO not found.' });
    
    await AuditLog.create({
      userId: req.user.id, userName: req.user.name, userEmail: req.user.email,
      action: 'ARCHIVE_PEO', details: `Archived PEO ${peo.peoCode}`, category: 'Academic'
    });
    
    return res.status(200).json({ message: 'PEO archived successfully.' });
  } catch (error) {
    return next(error);
  }
};
