import * as peoPsoService from '../services/peoPsoService.js';

export const getPeoPsoByDept = async (req, res, next) => {
  try {
    const { deptId } = req.params;
    const { regulationId } = req.query;
    const peoPso = await peoPsoService.getPeoPsoByDept(deptId, regulationId);
    return res.status(200).json({ peoPso });
  } catch (error) {
    return next(error);
  }
};

export const updatePeoPso = async (req, res, next) => {
  try {
    const { deptId } = req.params;
    const { regulationId } = req.query;
    const peoPso = await peoPsoService.updatePeoPso(deptId, req.body, req.user, regulationId);
    return res.status(200).json({ peoPso, message: 'PEO, PSO & PO outcomes updated successfully.' });
  } catch (error) {
    return next(error);
  }
};
