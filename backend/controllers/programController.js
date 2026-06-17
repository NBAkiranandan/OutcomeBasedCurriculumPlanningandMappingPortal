import * as programRepository from '../repositories/programRepository.js';
import User from '../models/User.js';

export const getPrograms = async (req, res, next) => {
  try {
    const programs = await programRepository.findAllPrograms();
    return res.status(200).json({ programs });
  } catch (error) {
    return next(error);
  }
};

export const createProgram = async (req, res, next) => {
  try {
    const program = await programRepository.createProgram(req.body);
    return res.status(201).json({ program, message: 'Academic program created successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await programRepository.findAllDepartments();
    return res.status(200).json({ departments });
  } catch (error) {
    return next(error);
  }
};

export const getDepartmentsByProgram = async (req, res, next) => {
  try {
    const { programId } = req.params;
    const departments = await programRepository.findDepartmentsByProgram(programId);
    return res.status(200).json({ departments });
  } catch (error) {
    return next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const dept = await programRepository.createDepartment(req.body);
    return res.status(201).json({ department: dept, message: 'Academic department created successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const program = await programRepository.updateProgram(id, req.body);
    if (!program) return res.status(404).json({ message: 'Program not found' });
    return res.status(200).json({ program, message: 'Program updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

export const deleteProgram = async (req, res, next) => {
  try {
    const { id } = req.params;
    const program = await programRepository.deleteProgram(id);
    if (!program) return res.status(404).json({ message: 'Program not found' });
    return res.status(200).json({ 
      program, 
      message: `Program accounts successfully ${program.isActive ? 'activated' : 'deactivated'}.` 
    });
  } catch (error) {
    return next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await programRepository.updateDepartment(id, req.body);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    return res.status(200).json({ department, message: 'Department updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await programRepository.deleteDepartment(id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    return res.status(200).json({ 
      department, 
      message: `Department successfully ${department.isActive ? 'activated' : 'deactivated'}.` 
    });
  } catch (error) {
    return next(error);
  }
};

export const assignHod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const department = await programRepository.updateDepartment(id, { hodId: userId || null });
    if (!department) return res.status(404).json({ message: 'Department not found' });

    if (userId) {
      await User.updateMany({ departmentId: id, role: 'HOD' }, { role: 'Faculty' });
      await User.findByIdAndUpdate(userId, { role: 'HOD', departmentId: id });
    }

    return res.status(200).json({ department, message: 'HOD assigned successfully.' });
  } catch (error) {
    return next(error);
  }
};
