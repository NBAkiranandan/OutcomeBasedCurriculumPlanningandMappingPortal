import * as regulationRepository from '../repositories/regulationRepository.js';
import * as courseRepository from '../repositories/courseRepository.js';
import CourseVersion from '../models/CourseVersion.js';
import AuditLog from '../models/AuditLog.js';

export const getAllRegulations = async () => {
  return regulationRepository.findAllRegulations();
};

export const getRegulationsByDept = async (deptId) => {
  return regulationRepository.findRegulationsByDept(deptId);
};

export const getRegulationById = async (id) => {
  return regulationRepository.findRegulationById(id);
};

export const createNewRegulation = async (regData, operatorUser) => {
  const reg = await regulationRepository.createRegulation(regData);
  

  await AuditLog.create({
    userId: operatorUser.id,
    userName: operatorUser.name,
    userEmail: operatorUser.email,
    action: 'CREATE_REGULATION',
    details: `Created new regulation code ${reg.code} for program ID ${reg.programId}`,
    category: 'Configuration'
  });

  return reg;
};

export const cloneRegulation = async (cloneConfig, operatorUser) => {
  const { 
    sourceRegulationId, 
    targetCode, 
    targetAcademicYear, 
    clonePeos, 
    clonePsos, 
    cloneCourseStructure, 
    cloneSemesterMapping 
  } = cloneConfig;

  // 1. Fetch source regulation details
  const sourceReg = await regulationRepository.findRegulationById(sourceRegulationId);
  if (!sourceReg) {
    throw new Error('Source regulation context not found.');
  }

  // 2. Double check if regulation code already exists in program context
  const existingRegs = await regulationRepository.findRegulationsByProgram(sourceReg.programId._id);
  if (existingRegs.some(r => r.code === targetCode)) {
    throw new Error(`Regulation code ${targetCode} already registered for this program.`);
  }

  // 3. Create the target regulation
  const targetReg = await regulationRepository.createRegulation({
    code: targetCode,
    academicYear: targetAcademicYear,
    programId: sourceReg.programId._id,
    durationYears: sourceReg.durationYears,
    semesterCount: sourceReg.semesterCount,
    isActive: true
  });


  // 5. Clone Course Versions
  if (cloneCourseStructure) {
    const sourceVersions = await courseRepository.findVersionsByRegulation(sourceRegulationId);
    for (const sourceVer of sourceVersions) {
      await CourseVersion.create({
        courseId: sourceVer.courseId._id,
        regulationId: targetReg._id,
        semester: cloneSemesterMapping ? sourceVer.semester : 1,
        credits: sourceVer.credits ? { ...sourceVer.credits } : { L: 3, T: 0, P: 0, S: 0, C: 3 },
        category: sourceVer.category || 'PC',
        objectives: sourceVer.objectives ? [...sourceVer.objectives] : [],
        prerequisites: sourceVer.prerequisites ? [...sourceVer.prerequisites] : [],
        status: 'Draft', // Set cloned versions as draft for revision
        assignedCoordinator: sourceVer.assignedCoordinator ? sourceVer.assignedCoordinator._id : null,
        courseOutcomes: sourceVer.courseOutcomes ? sourceVer.courseOutcomes.map(co => ({
          coCode: co.coCode,
          description: co.description,
          bloomLevel: co.bloomLevel
        })) : [],
        coPoMappings: sourceVer.coPoMappings ? sourceVer.coPoMappings.map(m => {
          const poMap = new Map();
          if (m.po) {
            const entries = typeof m.po.entries === 'function' ? m.po.entries() : Object.entries(m.po);
            for (const [k, v] of entries) poMap.set(k, v);
          }
          return { coCode: m.coCode, po: poMap };
        }) : [],
        coPsoMappings: sourceVer.coPsoMappings ? sourceVer.coPsoMappings.map(m => {
          const psoMap = new Map();
          if (m.pso) {
            const entries = typeof m.pso.entries === 'function' ? m.pso.entries() : Object.entries(m.pso);
            for (const [k, v] of entries) psoMap.set(k, v);
          }
          return { coCode: m.coCode, pso: psoMap };
        }) : [],
        syllabusUnits: sourceVer.syllabusUnits ? sourceVer.syllabusUnits.map(u => ({
          unitNumber: u.unitNumber,
          title: u.title,
          description: u.description,
          topics: u.topics ? [...u.topics] : [],
          outcomes: u.outcomes,
          hours: u.hours
        })) : [],
        labPracticals: sourceVer.labPracticals ? sourceVer.labPracticals.map(lab => ({
          title: lab.title,
          hours: lab.hours,
          description: lab.description
        })) : [],
        miniProjects: sourceVer.miniProjects ? sourceVer.miniProjects.map(proj => ({
          title: proj.title,
          description: proj.description
        })) : [],
        textbooks: sourceVer.textbooks ? [...sourceVer.textbooks] : [],
        referenceMaterials: sourceVer.referenceMaterials ? [...sourceVer.referenceMaterials] : [],
        cieSee: sourceVer.cieSee ? { ...sourceVer.cieSee } : { cieMaxMarks: 40, seeMaxMarks: 60 }
      });
    }
  }

  // 6. Record Audit Log
  await AuditLog.create({
    userId: operatorUser.id,
    userName: operatorUser.name,
    userEmail: operatorUser.email,
    action: 'CLONE_REGULATION',
    details: `Cloned Regulation ${sourceReg.code} into ${targetReg.code} in program ${sourceReg.programId.code}. Config: PEOs: ${clonePeos}, PSOs: ${clonePsos}, Structure: ${cloneCourseStructure}`,
    category: 'Configuration'
  });

  return targetReg;
};

