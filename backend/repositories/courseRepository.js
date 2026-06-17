import Course from '../models/Course.js';
import CourseVersion from '../models/CourseVersion.js';

// Global Course Repository
export const findAllCourses = async () => {
  return Course.find().populate('departmentId').sort({ code: 1 });
};

export const findCoursesByDepartment = async (departmentId) => {
  return Course.find({ departmentId }).sort({ code: 1 });
};

export const findCourseById = async (id) => {
  return Course.findById(id).populate('departmentId');
};

export const findCourseByCode = async (code) => {
  return Course.findOne({ code });
};

export const createCourse = async (courseData) => {
  const course = new Course(courseData);
  return course.save();
};

// Regulation Centric CourseVersion Repository
export const findVersionById = async (versionId) => {
  return CourseVersion.findById(versionId)
    .populate({
      path: 'courseId',
      populate: { path: 'departmentId' }
    })
    .populate('regulationId')
    .populate('assignedCoordinator', '-password');
};

export const findVersionByCourseAndRegulation = async (courseId, regulationId) => {
  return CourseVersion.findOne({ courseId, regulationId })
    .populate('courseId')
    .populate('regulationId')
    .populate('assignedCoordinator', '-password');
};

export const findVersionsByRegulation = async (regulationId) => {
  return CourseVersion.find({ regulationId })
    .populate({
      path: 'courseId',
      populate: { path: 'departmentId' }
    })
    .populate('assignedCoordinator', '-password')
    .sort({ semester: 1, 'courseId.code': 1 });
};

export const findVersionsByCoordinator = async (coordinatorId) => {
  return CourseVersion.find({ assignedCoordinator: coordinatorId })
    .populate({
      path: 'courseId',
      populate: { path: 'departmentId' }
    })
    .populate('regulationId')
    .populate('assignedCoordinator', '-password')
    .sort({ regulationId: 1, semester: 1 });
};

export const createCourseVersion = async (versionData) => {
  const version = new CourseVersion(versionData);
  return version.save();
};

export const updateCourseVersion = async (versionId, updateData) => {
  return CourseVersion.findByIdAndUpdate(
    versionId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('courseId').populate('regulationId');
};

export const updateWorkflowStatus = async (versionId, status, comments = '') => {
  return CourseVersion.findByIdAndUpdate(
    versionId,
    { $set: { status, comments } },
    { new: true }
  ).populate('courseId').populate('regulationId');
};

export const deleteCourseVersion = async (versionId) => {
  return CourseVersion.findByIdAndDelete(versionId);
};

export const deleteCourseById = async (courseId) => {
  return Course.findByIdAndDelete(courseId);
};

export const deleteVersionsByCourseId = async (courseId) => {
  return CourseVersion.deleteMany({ courseId });
};
