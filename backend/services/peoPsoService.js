import PeoPso from '../models/PeoPso.js';
import AuditLog from '../models/AuditLog.js';

const defaultPOs = [
  { code: 'PO1', description: 'Engineering Knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization.' },
  { code: 'PO2', description: 'Problem Analysis: Identify, formulate, review research literature, and analyze complex engineering problems.' },
  { code: 'PO3', description: 'Design/Development of Solutions: Design solutions for complex engineering problems.' },
  { code: 'PO4', description: 'Conduct Investigations: Use research-based knowledge and research methods.' },
  { code: 'PO5', description: 'Modern Tool Usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools.' },
  { code: 'PO6', description: 'The Engineer and Society: Apply reasoning informed by the contextual knowledge.' },
  { code: 'PO7', description: 'Environment and Sustainability: Understand the impact of the professional engineering solutions.' },
  { code: 'PO8', description: 'Ethics: Apply ethical principles and commit to professional ethics and responsibilities.' },
  { code: 'PO9', description: 'Individual and Team Work: Function effectively as an individual, and as a member or leader in diverse teams.' },
  { code: 'PO10', description: 'Communication: Communicate effectively on complex engineering activities.' },
  { code: 'PO11', description: 'Project Management & Finance: Demonstrate knowledge and understanding of the engineering and management principles.' },
  { code: 'PO12', description: 'Life-long Learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning.' }
];

export const getPeoPsoByDept = async (departmentId, regulationId) => {
  const query = { departmentId, isDeleted: false };
  if (regulationId && regulationId !== 'undefined' && regulationId !== 'null') {
    query.regulationId = regulationId;
  } else {
    query.regulationId = null;
  }

  let record = await PeoPso.findOne(query);
  if (!record) {
    // Attempt to find any existing PeoPso for this department to use as template
    const templateRecord = await PeoPso.findOne({ departmentId, isDeleted: false }).sort({ createdAt: -1 });

    try {
      record = await PeoPso.create({
        departmentId,
        regulationId: query.regulationId,
        peos: templateRecord ? templateRecord.peos : [],
        psos: templateRecord ? templateRecord.psos : [],
        pos: templateRecord ? templateRecord.pos : defaultPOs
      });
    } catch (err) {
      if (err.code === 11000) {
        record = await PeoPso.findOne(query);
      } else {
        throw err;
      }
    }
  }
  return record;
};

export const updatePeoPso = async (departmentId, data, operatorUser, regulationId) => {
  const query = { departmentId, isDeleted: false };
  if (regulationId && regulationId !== 'undefined' && regulationId !== 'null') {
    query.regulationId = regulationId;
  } else {
    query.regulationId = null;
  }

  const updateFields = {
    ...data,
    departmentId,
    isDeleted: false
  };
  if (regulationId && regulationId !== 'undefined') {
    updateFields.regulationId = regulationId;
  }

  const updated = await PeoPso.findOneAndUpdate(
    query,
    updateFields,
    { new: true, upsert: true }
  );
  
  if (operatorUser) {
    await AuditLog.create({
      userId: operatorUser.id,
      userName: operatorUser.name,
      userEmail: operatorUser.email,
      action: 'UPDATE_PEO_PSO',
      details: `Updated PEO/PSO/PO objectives for department ID ${departmentId}${regulationId ? ` and regulation ID ${regulationId}` : ''}`,
      category: 'Academic'
    });
  }

  return updated;
};
