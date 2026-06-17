import Program from '../models/Program.js';
import Department from '../models/Department.js';

// Program queries
export const findAllPrograms = async () => {
  return Program.find().sort({ name: 1 });
};

export const findProgramById = async (id) => {
  return Program.findById(id);
};

export const createProgram = async (programData) => {
  const program = new Program(programData);
  return program.save();
};

// Department queries
export const findAllDepartments = async () => {
  return Department.find().populate('programId').populate('regulationId').sort({ name: 1 });
};

export const findDepartmentsByProgram = async (programId) => {
  return Department.find({ programId }).sort({ name: 1 });
};

export const findDepartmentById = async (id) => {
  return Department.findById(id).populate('programId').populate('regulationId');
};

export const createDepartment = async (deptData) => {
  const dept = new Department(deptData);
  return dept.save();
};

export const updateProgram = async (id, updateData) => {
  return Program.findByIdAndUpdate(id, updateData, { new: true });
};

export const deleteProgram = async (id) => {
  // We can do logical delete by toggling isActive, or hard delete.
  // Let's support toggling isActive if it exists, or just removing.
  const program = await Program.findById(id);
  if (program) {
    program.isActive = !program.isActive;
    return program.save();
  }
  return null;
};

export const updateDepartment = async (id, updateData) => {
  return Department.findByIdAndUpdate(id, updateData, { new: true }).populate('programId').populate('regulationId');
};

export const deleteDepartment = async (id) => {
  const dept = await Department.findById(id);
  if (dept) {
    dept.isActive = !dept.isActive;
    return dept.save();
  }
  return null;
};
