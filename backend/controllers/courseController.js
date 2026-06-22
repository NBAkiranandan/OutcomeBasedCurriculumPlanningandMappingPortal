import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as courseService from '../services/courseService.js';
import { generateSyllabusDocx } from '../services/docxService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getCoursesByDept = async (req, res, next) => {
  try {
    let deptId = req.params.departmentId;
    if (req.user.role === 'HOD') {
      deptId = req.user.departmentId;
    } else if (!deptId) {
      deptId = req.user.departmentId;
    }
    if (!deptId) {
      return res.status(400).json({ message: 'Department context required.' });
    }
    const courses = await courseService.getCoursesByDept(deptId);
    return res.status(200).json({ courses });
  } catch (error) {
    return next(error);
  }
};

export const getAllCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getAllCourses();
    return res.status(200).json({ courses });
  } catch (error) {
    return next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const { code, title, departmentId, regulationId, semester } = req.body;
    const version = await courseService.createNewCourse(
      { code, title, departmentId },
      regulationId,
      semester,
      req.user
    );
    return res.status(201).json({ 
      version, 
      message: `Course ${code} added to semester ${semester} successfully.` 
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const assignCoordinator = async (req, res, next) => {
  try {
    const { courseVersionId, coordinatorId } = req.body;
    const version = await courseService.assignCourseCoordinator(
      courseVersionId,
      coordinatorId,
      req.user
    );
    return res.status(200).json({ 
      version, 
      message: 'Coordinator assigned successfully.' 
    });
  } catch (error) {
    return next(error);
  }
};

export const getVersionsByRegulation = async (req, res, next) => {
  try {
    const { regulationId } = req.params;
    const versions = await courseService.getVersionsByRegulation(regulationId);
    return res.status(200).json({ versions });
  } catch (error) {
    return next(error);
  }
};

export const getVersionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const version = await courseService.getVersionById(id);
    if (!version) {
      return res.status(404).json({ message: 'Course file not found.' });
    }
    return res.status(200).json({ version });
  } catch (error) {
    return next(error);
  }
};

export const getCoordinatorCourses = async (req, res, next) => {
  try {
    const coordinatorId = req.user.id;
    const versions = await courseService.getVersionsByCoordinator(coordinatorId);
    return res.status(200).json({ versions });
  } catch (error) {
    return next(error);
  }
};

export const updateSyllabusDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const version = await courseService.saveSyllabusDraft(id, req.body, req.user);
    return res.status(200).json({ 
      version, 
      message: 'Course file progress saved successfully.' 
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateWorkflow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const version = await courseService.updateWorkflow(id, status, comments, req.user);
    return res.status(200).json({ 
      version, 
      message: `Course file status updated to [${status}].` 
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const downloadOriginalPDF = async (req, res, next) => {
  try {
    const pdfPath = path.resolve(__dirname, '../../src/assets/B.Tech_CSE_ProgramStructure_Syllabus (2)R24.pdf');
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'Curriculum PDF file not found on server.' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="B.Tech_CSE_ProgramStructure_Syllabus_R24.pdf"');
    return res.sendFile(pdfPath);
  } catch (error) {
    return next(error);
  }
};

export const downloadCourseWord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const version = await courseService.getVersionById(id);
    if (!version) {
      return res.status(404).json({ message: 'Course version not found.' });
    }
    const buffer = await generateSyllabusDocx(version);
    const filename = `${version.courseId.code}_Syllabus.docx`.replace(/\s+/g, '_');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
};

export const deleteCourseVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    await courseService.deleteCourseVersion(id, req.user);
    return res.status(200).json({ message: 'Course removed from regulation successfully.' });
  } catch (error) {
    return next(error);
  }
};

export const deleteGlobalCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    await courseService.deleteGlobalCourse(id, req.user);
    return res.status(200).json({ message: 'Global course and associated versions deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};
