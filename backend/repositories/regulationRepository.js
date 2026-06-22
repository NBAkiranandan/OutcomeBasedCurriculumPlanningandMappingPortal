import Regulation from '../models/Regulation.js';
import PeoPso from '../models/PeoPso.js';
import Department from '../models/Department.js';

export const findAllRegulations = async () => {
  return Regulation.find({ isDeleted: { $ne: true } })
    .populate('programId')
    .sort({ academicYear: -1, code: -1 });
};

export const findRegulationsByProgram = async (programId) => {
  return Regulation.find({ programId, isDeleted: { $ne: true } })
    .populate('programId')
    .sort({ academicYear: -1 });
};

export const findRegulationsByDept = async (departmentId) => {
  const dept = await Department.findById(departmentId);
  if (!dept) return [];
  return Regulation.find({ programId: dept.programId, isDeleted: { $ne: true } })
    .populate('programId')
    .sort({ academicYear: -1 });
};

export const findRegulationById = async (id) => {
  return Regulation.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate('programId');
};

export const createRegulation = async (regData) => {
  const regulation = new Regulation(regData);
  return regulation.save();
};

export const updateActiveStatus = async (id, isActive) => {
  return Regulation.findByIdAndUpdate(id, { isActive }, { new: true });
};

// PEO / PSO / PO specific mappings query
export const findPeoPsoByRegulationId = async (regulationId) => {
  return PeoPso.findOne({ regulationId });
};

export const savePeoPso = async (regulationId, data) => {
  return PeoPso.findOneAndUpdate(
    { regulationId },
    { ...data, regulationId },
    { new: true, upsert: true }
  );
};

