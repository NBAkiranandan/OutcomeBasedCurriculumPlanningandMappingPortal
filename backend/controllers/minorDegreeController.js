import MinorDegree from '../models/MinorDegree.js';
import MinorDegreeCourse from '../models/MinorDegreeCourse.js';
import Regulation from '../models/Regulation.js';
import Department from '../models/Department.js';
import AuditLog from '../models/AuditLog.js';

// Helper to check regulation lock
const isRegulationLocked = async (regulationId) => {
  const reg = await Regulation.findById(regulationId);
  if (!reg) return true;
  return reg.status === 'LOCKED' || reg.status === 'ARCHIVED' || !reg.isActive;
};

// ---------------------------------------------------------
// MINOR DEGREES
// ---------------------------------------------------------

export const getMinorDegrees = async (req, res, next) => {
  try {
    const { departmentId, regulationId } = req.query;
    const filter = { isDeleted: { $ne: true } };
    if (departmentId) filter.departmentId = departmentId;
    if (regulationId) filter.regulationId = regulationId;

    const minorDegrees = await MinorDegree.find(filter).sort({ minorName: 1 }).lean();

    // Populate courses for each
    for (let i = 0; i < minorDegrees.length; i++) {
      const courses = await MinorDegreeCourse.find({ minorDegreeId: minorDegrees[i]._id, isDeleted: { $ne: true } }).sort({ semester: 1 }).lean();
      minorDegrees[i].courses = courses;
      const renderedGroups = new Set();
      minorDegrees[i].currentCredits = courses.reduce((sum, c) => {
        const isGrouped = !!c.orGroupId;
        if (isGrouped && renderedGroups.has(c.orGroupId)) return sum;
        if (isGrouped) renderedGroups.add(c.orGroupId);
        return sum + c.credits;
      }, 0);
    }

    return res.status(200).json({ minorDegrees });
  } catch (error) {
    return next(error);
  }
};

export const getMinorDegree = async (req, res, next) => {
  try {
    const minor = await MinorDegree.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).lean();
    if (!minor) return res.status(404).json({ message: 'Minor Degree not found' });

    const courses = await MinorDegreeCourse.find({ minorDegreeId: minor._id, isDeleted: { $ne: true } }).sort({ semester: 1 }).lean();
    minor.courses = courses;
    minor.currentCredits = courses.reduce((sum, c) => sum + c.credits, 0);

    return res.status(200).json({ minorDegree: minor });
  } catch (error) {
    return next(error);
  }
};

export const getAllPublished = async (req, res, next) => {
  try {
    const { regulationId } = req.query;
    const filter = { status: 'Published', isDeleted: { $ne: true } };
    if (regulationId) filter.regulationId = regulationId;

    const publishedMinors = await MinorDegree.find(filter).sort({ departmentName: 1, minorName: 1 }).lean();

    const grouped = {};
    for (let i = 0; i < publishedMinors.length; i++) {
      const minor = publishedMinors[i];
      const courses = await MinorDegreeCourse.find({ minorDegreeId: minor._id, isDeleted: { $ne: true } }).sort({ semester: 1 }).lean();
      minor.courses = courses;
      const renderedGroups = new Set();
      minor.currentCredits = courses.reduce((sum, c) => {
        const isGrouped = !!c.orGroupId;
        if (isGrouped && renderedGroups.has(c.orGroupId)) return sum;
        if (isGrouped) renderedGroups.add(c.orGroupId);
        return sum + c.credits;
      }, 0);

      const deptName = minor.departmentName || 'Unknown Department';
      if (!grouped[deptName]) grouped[deptName] = [];
      grouped[deptName].push(minor);
    }

    return res.status(200).json({ publishedMinorDegrees: grouped });
  } catch (error) {
    return next(error);
  }
};

export const createMinorDegree = async (req, res, next) => {
  try {
    const { minorName, regulationId, departmentId, description, requiredCredits, eligibility } = req.body;

    if (await isRegulationLocked(regulationId)) {
      return res.status(423).json({ message: 'Cannot create minor degree. Regulation is locked.' });
    }

    const reg = await Regulation.findById(regulationId);
    const dept = await Department.findById(departmentId);

    const newMinor = await MinorDegree.create({
      minorName,
      regulationId,
      regulationName: reg ? reg.name : '',
      departmentId,
      departmentName: dept ? dept.name : '',
      description,
      requiredCredits,
      eligibility,
      status: 'Draft',
      createdBy: req.user.id
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'CREATE_MINOR_DEGREE',
      details: `Created Minor Degree: ${minorName}`,
      category: 'Academic'
    });

    return res.status(201).json({ message: 'Minor Degree created successfully', minorDegree: newMinor });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A minor degree with this name already exists for this regulation and department.' });
    }
    return next(error);
  }
};

export const updateMinorDegree = async (req, res, next) => {
  try {
    const { minorName, description, requiredCredits, eligibility } = req.body;
    const minor = await MinorDegree.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

    if (!minor) return res.status(404).json({ message: 'Minor Degree not found' });
    if (await isRegulationLocked(minor.regulationId)) {
      return res.status(423).json({ message: 'Cannot update minor degree. Regulation is locked.' });
    }

    minor.minorName = minorName || minor.minorName;
    minor.description = description !== undefined ? description : minor.description;
    minor.requiredCredits = requiredCredits || minor.requiredCredits;
    minor.eligibility = eligibility !== undefined ? eligibility : minor.eligibility;
    minor.status = 'Draft'; // Editing drops it back to Draft

    await minor.save();

    return res.status(200).json({ message: 'Minor Degree updated successfully', minorDegree: minor });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A minor degree with this name already exists.' });
    }
    return next(error);
  }
};

export const deleteMinorDegree = async (req, res, next) => {
  try {
    const minor = await MinorDegree.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!minor) return res.status(404).json({ message: 'Minor Degree not found' });

    if (await isRegulationLocked(minor.regulationId)) {
      return res.status(423).json({ message: 'Cannot delete minor degree. Regulation is locked.' });
    }

    minor.isDeleted = true;
    minor.deletedAt = new Date();
    await minor.save();

    await MinorDegreeCourse.updateMany(
      { minorDegreeId: minor._id },
      { isDeleted: true, deletedAt: new Date() }
    );

    return res.status(200).json({ message: 'Minor Degree deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

export const publishMinorDegree = async (req, res, next) => {
  try {
    const minor = await MinorDegree.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!minor) return res.status(404).json({ message: 'Minor Degree not found' });

    if (await isRegulationLocked(minor.regulationId)) {
      return res.status(423).json({ message: 'Cannot publish minor degree. Regulation is locked.' });
    }

    const courses = await MinorDegreeCourse.find({ minorDegreeId: minor._id, isDeleted: { $ne: true } });
    const groupSizes = {};
    const renderedGroups = new Set();
    let currentCredits = 0;
    
    courses.forEach(c => {
      const isGrouped = !!c.orGroupId;
      if (isGrouped && renderedGroups.has(c.orGroupId)) {
        return; // skip duplicate OR course
      }
      if (isGrouped) renderedGroups.add(c.orGroupId);
      currentCredits += c.credits;
    });

    if (currentCredits < minor.requiredCredits) {
      return res.status(400).json({ message: `Cannot publish. Required credits: ${minor.requiredCredits}, but only ${currentCredits} credits added.` });
    }

    minor.status = 'Published';
    minor.currentCredits = currentCredits;
    await minor.save();

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'PUBLISH_MINOR_DEGREE',
      details: `Published Minor Degree: ${minor.minorName} with ${currentCredits} credits.`,
      category: 'Academic'
    });

    return res.status(200).json({ message: 'Minor Degree published successfully', minorDegree: minor });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------
// MINOR DEGREE COURSES
// ---------------------------------------------------------

export const addCourse = async (req, res, next) => {
  try {
    const { minorDegreeId } = req.params;
    const { courseCode, courseName, credits, semester, courseType, description, orGroupId } = req.body;

    const minor = await MinorDegree.findOne({ _id: minorDegreeId, isDeleted: { $ne: true } });
    if (!minor) return res.status(404).json({ message: 'Minor degree not found.' });

    // HOD can only add courses to their department's minor degree
    if (req.user.role === 'HOD' && minor.departmentId.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const existingCourse = await MinorDegreeCourse.findOne({ minorDegreeId, courseCode, isDeleted: { $ne: true } });
    if (existingCourse) return res.status(400).json({ message: 'Course is already added to this minor degree.' });

    const newCourse = await MinorDegreeCourse.create({
      minorDegreeId,
      courseCode,
      courseName,
      credits,
      semester,
      courseType,
      description,
      orGroupId
    });

    return res.status(201).json({ course: newCourse, message: 'Course added to minor degree.' });
  } catch (error) {
    return next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { courseCode, courseName, credits, semester, courseType, description, orGroupId } = req.body;
    const course = await MinorDegreeCourse.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    
    if (!course) return res.status(404).json({ message: 'Course not found in minor degree.' });

    const minor = await MinorDegree.findById(course.minorDegreeId);
    if (req.user.role === 'HOD' && minor.departmentId.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (courseCode !== undefined) course.courseCode = courseCode;
    if (courseName !== undefined) course.courseName = courseName;
    if (credits !== undefined) course.credits = credits;
    if (semester !== undefined) course.semester = semester;
    if (courseType !== undefined) course.courseType = courseType;
    if (description !== undefined) course.description = description;
    if (orGroupId !== undefined) course.orGroupId = orGroupId;
    
    await course.save();

    minor.status = 'Draft';
    await minor.save();

    return res.status(200).json({ message: 'Course updated successfully', course });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course code already exists in this minor degree.' });
    }
    return next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const course = await MinorDegreeCourse.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const minor = await MinorDegree.findById(course.minorDegreeId);
    if (await isRegulationLocked(minor.regulationId)) {
      return res.status(423).json({ message: 'Cannot delete course. Regulation is locked.' });
    }

    course.isDeleted = true;
    course.deletedAt = new Date();
    await course.save();

    minor.status = 'Draft';
    await minor.save();

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    return next(error);
  }
};
