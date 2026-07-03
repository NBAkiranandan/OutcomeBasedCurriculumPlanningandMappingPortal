import MinorStream from '../models/MinorStream.js';
import AuditLog from '../models/AuditLog.js';

export const getMinorStreams = async (req, res, next) => {
  try {
    const { departmentId, regulationId } = req.query;
    const filter = { isDeleted: { $ne: true } };
    if (req.user.role === 'HOD') {
      filter.departmentId = req.user.departmentId;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }
    if (regulationId) filter.regulationId = regulationId;
    
    const streams = await MinorStream.find(filter)
      .populate('courses') // keep for backward compatibility
      .populate('departmentId')
      .populate('regulationId')
      .sort({ displayOrder: 1, name: 1 })
      .lean();
      
    // Fetch detailed stream courses
    for (const stream of streams) {
      stream.streamCourses = await MinorStreamCourse.find({ minorStreamId: stream._id, isDeleted: { $ne: true } })
        .sort({ semester: 1, courseOrder: 1 })
        .lean();
    }
      
    return res.status(200).json({ streams });
  } catch (error) {
    return next(error);
  }
};

export const createMinorStream = async (req, res, next) => {
  try {
    const { streamCode, name, description, courses, status, departmentId, regulationId, minorDegreeId, displayOrder, syllabus, coPoMapping } = req.body;
    let targetDeptId = departmentId;
    if (req.user.role === 'HOD') {
      targetDeptId = req.user.departmentId || departmentId;
    }
    
    const newStream = new MinorStream({
      streamCode,
      name,
      description,
      courses: courses || [],
      status: status || 'Draft',
      departmentId: targetDeptId,
      regulationId,
      minorDegreeId: minorDegreeId || null,
      displayOrder: displayOrder || 0,
      syllabus: syllabus || '',
      coPoMapping: coPoMapping || {},
      created_by: req.user.id
    });
    
    await newStream.save();
    
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'CREATE_MINOR_STREAM',
      details: `Created minor stream ${streamCode} - ${name}`,
      category: 'Academic'
    });
    
    return res.status(201).json({ stream: newStream, message: 'Minor stream created successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateMinorStream = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { streamCode, name, description, courses, status, minorDegreeId, displayOrder, syllabus, coPoMapping } = req.body;
    
    const stream = await MinorStream.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!stream) return res.status(404).json({ message: 'Minor stream not found.' });

    if (req.user.role === 'HOD' && stream.departmentId.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only edit minor streams of your own department.' });
    }
    
    if (streamCode !== undefined) stream.streamCode = streamCode;
    if (name !== undefined) stream.name = name;
    if (description !== undefined) stream.description = description;
    if (courses !== undefined) stream.courses = courses;
    if (status !== undefined) stream.status = status;
    if (minorDegreeId !== undefined) stream.minorDegreeId = minorDegreeId;
    if (displayOrder !== undefined) stream.displayOrder = displayOrder;
    if (syllabus !== undefined) stream.syllabus = syllabus;
    if (coPoMapping !== undefined) stream.coPoMapping = coPoMapping;
    stream.updated_by = req.user.id;
    
    await stream.save();
    
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'UPDATE_MINOR_STREAM',
      details: `Updated minor stream ${stream.name}`,
      category: 'Academic'
    });
    
    return res.status(200).json({ stream, message: 'Minor stream updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

export const deleteMinorStream = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stream = await MinorStream.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!stream) return res.status(404).json({ message: 'Minor stream not found.' });

    if (req.user.role === 'HOD' && stream.departmentId.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only delete minor streams of your own department.' });
    }

    const timestamp = Date.now();
    stream.streamCode = `${stream.streamCode}_del_${timestamp}`;
    stream.name = `${stream.name}_del_${timestamp}`;
    stream.isDeleted = true;
    stream.deletedAt = new Date();
    await stream.save();
    
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DELETE_MINOR_STREAM',
      details: `Soft-deleted minor stream ${stream.name}`,
      category: 'Academic'
    });
    
    return res.status(200).json({ message: 'Minor stream deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

import MinorStreamCourse from '../models/MinorStreamCourse.js';

export const addStreamCourse = async (req, res, next) => {
  try {
    const { minorStreamId } = req.params;
    const { courseCode, courseName, credits, semester, level, L, T, P, cie, see, total, prerequisite, courseOrder, courseType } = req.body;

    const stream = await MinorStream.findOne({ _id: minorStreamId, isDeleted: { $ne: true } });
    if (!stream) return res.status(404).json({ message: 'Minor stream not found.' });

    if (req.user.role === 'HOD' && stream.departmentId.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const existingCourse = await MinorStreamCourse.findOne({ minorStreamId, courseCode, isDeleted: { $ne: true } });
    if (existingCourse) return res.status(400).json({ message: 'Course is already added to this minor stream.' });

    const newCourse = await MinorStreamCourse.create({
      minorStreamId,
      courseCode,
      courseName,
      credits,
      semester,
      level, L, T, P, cie, see, total, prerequisite, courseOrder, courseType
    });

    return res.status(201).json({ message: 'Course added to minor stream', course: newCourse });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Course code already exists in this stream.' });
    return next(error);
  }
};

export const updateStreamCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const course = await MinorStreamCourse.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const stream = await MinorStream.findOne({ _id: course.minorStreamId, isDeleted: { $ne: true } });
    if (req.user.role === 'HOD' && stream && stream.departmentId.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    Object.assign(course, updateData);
    await course.save();

    return res.status(200).json({ message: 'Course updated', course });
  } catch (error) {
    return next(error);
  }
};

export const deleteStreamCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await MinorStreamCourse.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const stream = await MinorStream.findOne({ _id: course.minorStreamId, isDeleted: { $ne: true } });
    if (req.user.role === 'HOD' && stream && stream.departmentId.toString() !== req.user.departmentId.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const timestamp = Date.now();
    course.courseCode = `${course.courseCode}_del_${timestamp}`;
    course.isDeleted = true;
    course.deletedAt = new Date();
    await course.save();

    return res.status(200).json({ message: 'Course removed successfully.' });
  } catch (error) {
    return next(error);
  }
};
