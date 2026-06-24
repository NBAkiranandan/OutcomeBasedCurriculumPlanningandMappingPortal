import Pso from '../models/Pso.js';
import AuditLog from '../models/AuditLog.js';

export const getPsos = async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const filter = { is_active: true, isDeleted: { $ne: true } };
    if (departmentId) filter.departmentId = departmentId;
    
    const psos = await Pso.find(filter).sort({ psoCode: 1 });
    return res.status(200).json({ psos });
  } catch (error) {
    return next(error);
  }
};

export const createPso = async (req, res, next) => {
  try {
    const { psoCode, description, status, departmentId } = req.body;
    
    const newPso = new Pso({
      psoCode, description, status, departmentId, created_by: req.user.id
    });
    
    await newPso.save();
    
    await AuditLog.create({
      userId: req.user.id, userName: req.user.name, userEmail: req.user.email,
      action: 'CREATE_PSO', details: `Created PSO ${psoCode}`, category: 'Academic'
    });
    
    return res.status(201).json({ pso: newPso, message: 'PSO created successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updatePso = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_by: req.user.id };
    
    const pso = await Pso.findByIdAndUpdate(id, updateData, { new: true });
    if (!pso) return res.status(404).json({ message: 'PSO not found.' });
    
    await AuditLog.create({
      userId: req.user.id, userName: req.user.name, userEmail: req.user.email,
      action: 'UPDATE_PSO', details: `Updated PSO ${pso.psoCode}`, category: 'Academic'
    });
    
    return res.status(200).json({ pso, message: 'PSO updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

export const deletePso = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Soft delete
    const pso = await Pso.findByIdAndUpdate(id, { is_active: false, updated_by: req.user.id }, { new: true });
    if (!pso) return res.status(404).json({ message: 'PSO not found.' });
    
    await AuditLog.create({
      userId: req.user.id, userName: req.user.name, userEmail: req.user.email,
      action: 'ARCHIVE_PSO', details: `Archived PSO ${pso.psoCode}`, category: 'Academic'
    });
    
    return res.status(200).json({ message: 'PSO archived successfully.' });
  } catch (error) {
    return next(error);
  }
};
