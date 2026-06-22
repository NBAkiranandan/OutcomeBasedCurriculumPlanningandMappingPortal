import CourseAssignment from '../models/CourseAssignment.js';
import CourseVersion from '../models/CourseVersion.js';
import AuditLog from '../models/AuditLog.js';

export const getAssignments = async (req, res, next) => {
  try {
    const { departmentId, academicYear, semester } = req.query;
    const filter = { isDeleted: { $ne: true }, is_active: true };
    if (departmentId) filter.departmentId = departmentId;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;
    
    const assignments = await CourseAssignment.find(filter)
      .populate('facultyId', 'name email empId')
      .populate('courseId', 'code title credits');
      
    return res.status(200).json({ assignments });
  } catch (error) {
    return next(error);
  }
};

export const createAssignment = async (req, res, next) => {
  try {
    const { facultyId, courseId, academicYear, semester, section, departmentId } = req.body;
    
    // Automatically resolve regulationId from CourseVersion
    let regulationId = null;
    const courseVer = await CourseVersion.findOne({ courseId, semester, isDeleted: { $ne: true } });
    if (courseVer) {
      regulationId = courseVer.regulationId;
    }
    
    const newAssignment = new CourseAssignment({
      facultyId,
      courseId,
      academicYear,
      semester,
      section,
      departmentId,
      regulationId,
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
    const updateData = { ...req.body, updated_by: req.user.id };
    
    const assignment = await CourseAssignment.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      updateData,
      { new: true }
    );
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    
    return res.status(200).json({ assignment, message: 'Assignment updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

export const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await CourseAssignment.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    
    return res.status(200).json({ message: 'Assignment removed successfully.' });
  } catch (error) {
    return next(error);
  }
};
