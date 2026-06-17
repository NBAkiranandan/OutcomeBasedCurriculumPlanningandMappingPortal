import * as regulationService from '../services/regulationService.js';
import * as regulationRepository from '../repositories/regulationRepository.js';
import Regulation from '../models/Regulation.js';
import AuditLog from '../models/AuditLog.js';

export const getRegulations = async (req, res, next) => {
  try {
    const regulations = await regulationService.getAllRegulations();
    return res.status(200).json({ regulations });
  } catch (error) {
    return next(error);
  }
};

export const getRegulationsByProgram = async (req, res, next) => {
  try {
    const { programId } = req.params;
    const regulations = await regulationRepository.findRegulationsByProgram(programId);
    res.json({ regulations });
  } catch (error) {
    next(error);
  }
};

export const getRegulationsByDept = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const regulations = await regulationService.getRegulationsByDept(departmentId);
    return res.status(200).json({ regulations });
  } catch (error) {
    return next(error);
  }
};

export const createRegulation = async (req, res, next) => {
  try {
    const reg = await regulationService.createNewRegulation(req.body, req.user);
    return res.status(201).json({ regulation: reg, message: 'Academic regulation created successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};



export const updateRegulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reg = await Regulation.findByIdAndUpdate(id, req.body, { new: true })
      .populate('programId');
    
    if (!reg) return res.status(404).json({ message: 'Regulation not found' });

    let logAction = 'UPDATE_REGULATION';
    let logDetails = `Updated regulation details for ${reg.code}`;
    if (req.body.status === 'Published') {
      logAction = 'PUBLISH_REGULATION';
      logDetails = `Published regulation ${reg.code}`;
    } else if (req.body.status === 'Archived') {
      logAction = 'ARCHIVE_REGULATION';
      logDetails = `Archived regulation ${reg.code}`;
    }

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: logAction,
      details: logDetails,
      category: 'Configuration'
    });

    return res.status(200).json({ regulation: reg, message: `Regulation updated successfully to ${reg.status}.` });
  } catch (error) {
    return next(error);
  }
};

export const deleteRegulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reg = await Regulation.findByIdAndDelete(id);
    if (!reg) return res.status(404).json({ message: 'Regulation not found' });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DELETE_REGULATION',
      details: `Deleted regulation code ${reg.code}`,
      category: 'Configuration'
    });

    return res.status(200).json({ 
      regulation: reg, 
      message: `Regulation ${reg.code} successfully deleted.` 
    });
  } catch (error) {
    return next(error);
  }
};
