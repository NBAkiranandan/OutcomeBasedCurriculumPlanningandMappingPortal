import CourseAssignment from '../models/CourseAssignment.js';
import CourseVersion from '../models/CourseVersion.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const idsEqual = (left, right) => String(left || '') === String(right || '');

const resolveAssignmentVersion = async ({ courseId, regulationId, semester }) => {
  const filter = { courseId, isDeleted: { $ne: true } };
  if (regulationId) filter.regulationId = regulationId;
  if (semester) filter.semester = semester;
  return CourseVersion.findOne(filter)
    .populate({ path: 'courseId', populate: { path: 'departmentId' } })
    .populate('regulationId')
    .populate('assignedCoordinator', '-password');
};

export const getAssignments = async (req, res, next) => {
  try {
    const { departmentId, academicYear, semester, regulationId } = req.query;
    const filter = { isDeleted: { $ne: true }, is_active: true };
    if (req.user.role === 'HOD') {
      filter.departmentId = req.user.departmentId;
    } else if (req.user.role === 'Faculty') {
      filter.facultyId = req.user.id;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;
    if (regulationId) filter.regulationId = regulationId;
    
    const assignments = await CourseAssignment.find(filter)
      .populate('facultyId', 'name email empId')
      .populate('courseId', 'code title credits departmentId')
      .populate('regulationId', 'code academicYear')
      .populate('departmentId', 'name code')
      .sort({ academicYear: -1, semester: 1, section: 1 });
      
    return res.status(200).json({ assignments });
  } catch (error) {
    return next(error);
  }
};

export const getMyAssignedCourseVersions = async (req, res, next) => {
  try {
    const assignments = await CourseAssignment.find({
      facultyId: req.user.id,
      isDeleted: { $ne: true },
      is_active: true
    })
      .populate('courseId', 'code title departmentId')
      .populate('regulationId', 'code academicYear')
      .populate('departmentId', 'name code')
      .sort({ academicYear: -1, semester: 1, section: 1 })
      .lean();

    const seenVersionIds = new Set();
    const versions = [];

    for (const assignment of assignments) {
      const version = await resolveAssignmentVersion({
        courseId: assignment.courseId?._id || assignment.courseId,
        regulationId: assignment.regulationId?._id || assignment.regulationId,
        semester: assignment.semester
      });

      if (!version) continue;
      const versionId = String(version._id);
      if (seenVersionIds.has(versionId)) continue;
      seenVersionIds.add(versionId);

      const versionObj = version.toObject();
      versionObj.assignment = assignment;
      versions.push(versionObj);
    }

    return res.status(200).json({ versions });
  } catch (error) {
    return next(error);
  }
};

export const createAssignment = async (req, res, next) => {
  try {
    const { facultyId, courseId, academicYear, semester, section, departmentId, regulationId } = req.body;
    const targetDepartmentId = req.user.role === 'HOD' ? req.user.departmentId : departmentId;

    if (req.user.role === 'HOD' && !idsEqual(targetDepartmentId, req.user.departmentId)) {
      return res.status(403).json({ message: 'Forbidden: HOD can assign faculty only within their department.' });
    }

    const faculty = await User.findById(facultyId);
    if (!faculty || !['Faculty', 'Coordinator'].includes(faculty.role)) {
      return res.status(400).json({ message: 'Select a valid faculty or coordinator account.' });
    }
    if (!idsEqual(faculty.departmentId, targetDepartmentId)) {
      return res.status(400).json({ message: 'Selected faculty does not belong to this department.' });
    }

    const course = await Course.findById(courseId);
    if (!course || !idsEqual(course.departmentId, targetDepartmentId)) {
      return res.status(400).json({ message: 'Selected course does not belong to this department.' });
    }

    const courseVer = await resolveAssignmentVersion({ courseId, regulationId, semester });
    if (!courseVer) {
      return res.status(400).json({ message: 'Course is not mapped to the selected regulation and semester.' });
    }
    
    const existingAssignment = await CourseAssignment.findOne({
      facultyId,
      courseId,
      academicYear,
      semester,
      section
    });

    if (existingAssignment) {
      if (existingAssignment.isDeleted) {
        existingAssignment.isDeleted = false;
        existingAssignment.is_active = true;
        existingAssignment.departmentId = targetDepartmentId;
        existingAssignment.regulationId = courseVer.regulationId?._id || courseVer.regulationId;
        existingAssignment.updated_by = req.user.id;
        await existingAssignment.save();
        
        await AuditLog.create({
          userId: req.user.id, userName: req.user.name, userEmail: req.user.email,
          action: 'RESTORE_COURSE_ASSIGNMENT', details: `Restored previously deleted course assignment for faculty`, category: 'Academic'
        });
        
        return res.status(200).json({ assignment: existingAssignment, message: 'Faculty assigned successfully.' });
      } else {
        return res.status(400).json({ message: 'This exact assignment already exists and is active.' });
      }
    }

    const newAssignment = new CourseAssignment({
      facultyId,
      courseId,
      academicYear,
      semester,
      section,
      departmentId: targetDepartmentId,
      regulationId: courseVer.regulationId?._id || courseVer.regulationId,
      created_by: req.user.id
    });
    
    await newAssignment.save();
    
    await AuditLog.create({
      userId: req.user.id, userName: req.user.name, userEmail: req.user.email,
      action: 'ASSIGN_COURSE', details: `Assigned course to faculty`, category: 'Academic'
    });
    
    return res.status(201).json({ assignment: newAssignment, message: 'Faculty assigned successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await CourseAssignment.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!existing) return res.status(404).json({ message: 'Assignment not found.' });

    if (req.user.role === 'HOD' && !idsEqual(existing.departmentId, req.user.departmentId)) {
      return res.status(403).json({ message: 'Forbidden: You can edit only your department assignments.' });
    }

    const updateData = { ...req.body, updated_by: req.user.id };
    const targetDepartmentId = req.user.role === 'HOD'
      ? req.user.departmentId
      : (updateData.departmentId || existing.departmentId);

    const targetFacultyId = updateData.facultyId || existing.facultyId;
    const faculty = await User.findById(targetFacultyId);
    if (!faculty || !['Faculty', 'Coordinator'].includes(faculty.role)) {
      return res.status(400).json({ message: 'Select a valid faculty or coordinator account.' });
    }
    if (!idsEqual(faculty.departmentId, targetDepartmentId)) {
      return res.status(400).json({ message: 'Selected faculty does not belong to this department.' });
    }

    const targetCourseId = updateData.courseId || existing.courseId;
    const course = await Course.findById(targetCourseId);
    if (!course || !idsEqual(course.departmentId, targetDepartmentId)) {
      return res.status(400).json({ message: 'Selected course does not belong to this department.' });
    }

    const courseVer = await resolveAssignmentVersion({
      courseId: targetCourseId,
      regulationId: updateData.regulationId || existing.regulationId,
      semester: updateData.semester || existing.semester
    });
    if (!courseVer) {
      return res.status(400).json({ message: 'Course is not mapped to the selected regulation and semester.' });
    }
    updateData.departmentId = targetDepartmentId;
    updateData.regulationId = courseVer.regulationId?._id || courseVer.regulationId;
    
    const assignment = await CourseAssignment.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('facultyId', 'name email')
      .populate('courseId', 'code title')
      .populate('regulationId', 'code academicYear');
    
    return res.status(200).json({ assignment, message: 'Assignment updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

export const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await CourseAssignment.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!existing) return res.status(404).json({ message: 'Assignment not found.' });
    if (req.user.role === 'HOD' && !idsEqual(existing.departmentId, req.user.departmentId)) {
      return res.status(403).json({ message: 'Forbidden: You can delete only your department assignments.' });
    }

    const assignment = await CourseAssignment.findByIdAndUpdate(
      id,
      { isDeleted: true, is_active: false, deletedAt: new Date(), updated_by: req.user.id },
      { new: true }
    );
    
    return res.status(200).json({ message: 'Assignment removed successfully.' });
  } catch (error) {
    return next(error);
  }
};
