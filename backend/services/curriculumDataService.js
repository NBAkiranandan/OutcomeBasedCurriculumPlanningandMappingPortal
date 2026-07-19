import mongoose from 'mongoose';
import Regulation from '../models/Regulation.js';
import CourseVersion from '../models/CourseVersion.js';
import MinorStream from '../models/MinorStream.js';
import CourseCategory from '../models/CourseCategory.js';
import PrerequisiteLink from '../models/PrerequisiteLink.js';
import Department from '../models/Department.js';

export const getCourseLevelCode = (version) => {
  const courseLevelRaw = `${version.courseLevel || version.knowledgeLevel || ''}`.toLowerCase();
  if (courseLevelRaw.includes('advanced') || courseLevelRaw.includes(' ac') || courseLevelRaw.endsWith('-ac') || courseLevelRaw === 'ac') return 'AC';
  if (courseLevelRaw.includes('intermediate') || courseLevelRaw.includes(' ic') || courseLevelRaw.endsWith('-ic') || courseLevelRaw === 'ic') return 'IC';
  if (courseLevelRaw.includes('foundation') || courseLevelRaw.includes(' fc') || courseLevelRaw.endsWith('-fc') || courseLevelRaw === 'fc') return 'FC';

  const levelRaw = `${version.level || ''}`.toLowerCase();
  if (levelRaw === 'advanced') return 'AC';
  if (levelRaw === 'intermediate') return 'IC';
  if (levelRaw === 'foundation') return 'FC';

  return 'FC';
};

export const getMappingValue = (mapping, key) => {
  const source = mapping instanceof Map ? Object.fromEntries(mapping.entries()) : (mapping || {});
  const value = Number(source[key] || 0);
  return (Number.isFinite(value) && value > 0) ? String(value) : '';
};

export const deriveMappingColumns = (mappings = [], mapKey, prefix, fallbackCount) => {
  const maxFromMappings = mappings.reduce((max, mapping) => {
    const source = mapping?.[mapKey] instanceof Map ? Object.fromEntries(mapping[mapKey].entries()) : mapping?.[mapKey] || {};
    Object.entries(source).forEach(([key, rawValue]) => {
      const match = key.match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
      if (match && Number(rawValue || 0) > 0) max = Math.max(max, Number(match[1]));
    });
    return max;
  }, 0);
  const count = Math.max(fallbackCount, maxFromMappings);
  return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
};

export const formatCommonTo = (items = [], fallbackDeptName) => {
  const clean = items.map(item => String(item || '').trim()).filter(Boolean);
  if (clean.length === 0) return `(For ${fallbackDeptName})`;
  if (clean.length === 1) return `(Common to ${clean[0]})`;
  return `(Common to ${clean.slice(0, -1).join(', ')} & ${clean[clean.length - 1]})`;
};

export const getUecStream = (v) => {
  const code = String(v.courseId?.code || '').toUpperCase();
  const title = String(v.courseId?.title || '').toLowerCase();
  
  if (code.includes('AI') || title.includes('artificial intelligence') || title.includes('machine learning')) {
    return 'AI & ML';
  }
  if (code.includes('ME08') || code.includes('ME09') || title.includes('production excellence') || code.includes('ME058')) {
    return 'Production Excellence';
  }
  if (code.includes('MB01') || code.includes('MB02') || title.includes('supply chain') || title.includes('logistics')) {
    return 'Supply Chain Management';
  }
  if (code.includes('CE07') || code.includes('CE08') || code.includes('EE033') || code.includes('EE006') || title.includes('sustain') || title.includes('waste') || title.includes('energy')) {
    return 'Sustainability';
  }
  if (code.includes('CS032') || code.includes('IT03') || code.includes('CS028') || code.includes('CS069') || code.includes('CS030') || title.includes('security') || title.includes('hacking') || title.includes('cryptography')) {
    return 'Security';
  }
  return 'Others';
};

export const getDynamicCurriculumContext = async (book) => {
  const regulationCode = book.regulation || '';
  const regulation = await Regulation.findOne({ code: regulationCode }).populate('programId').lean();

  if (!regulation?._id) {
    return { regulation: null, courses: [], minorStreams: [], dbCategories: [], publishedMinorDegrees: {}, prereqLinks: [] };
  }

  const departmentId = String(book.departmentId?._id || book.departmentId || '');
  const versions = await CourseVersion.find({ regulationId: regulation._id, isDeleted: { $ne: true } })
    .populate({ path: 'courseId', populate: { path: 'departmentId' } })
    .sort({ semester: 1, 'courseId.code': 1 })
    .lean();

  const courses = departmentId
    ? versions.filter(version => {
        const courseDeptId = String(version.courseId?.departmentId?._id || version.courseId?.departmentId || '');
        return courseDeptId === departmentId || version.category === 'UEC';
      })
    : versions;

  const minorStreams = departmentId
    ? await MinorStream.find({ regulationId: regulation._id, departmentId, isDeleted: { $ne: true } })
        .populate({
          path: 'courses',
          model: 'Course',
          populate: { path: 'departmentId' }
        })
        .sort({ name: 1 }).lean()
    : [];

  const dbCategories = await CourseCategory.find().lean();
  const prereqLinks = await PrerequisiteLink.find({ regulationId: regulation._id, isDeleted: { $ne: true } })
    .populate('sourceCourseId')
    .populate('targetCourseId')
    .lean();

  // Fetch ALL published Minor Degrees for this regulation
  const MinorDegree = (await import('../models/MinorDegree.js')).default;
  const MinorDegreeCourse = (await import('../models/MinorDegreeCourse.js')).default;
  
  const publishedMinors = await MinorDegree.find({ regulationId: regulation._id, status: 'Published', isDeleted: { $ne: true } })
    .sort({ departmentName: 1, minorName: 1 })
    .lean();

  const publishedMinorDegrees = {};
  for (let minor of publishedMinors) {
    const minorCourses = await MinorDegreeCourse.find({ minorDegreeId: minor._id, isDeleted: { $ne: true } })
      .sort({ semester: 1 })
      .lean();
    minor.courses = minorCourses;
    
    const dName = minor.departmentName || 'Unknown Department';
    if (!publishedMinorDegrees[dName]) publishedMinorDegrees[dName] = [];
    publishedMinorDegrees[dName].push(minor);
  }

  return { regulation, courses, courseVersions: versions, minorStreams, dbCategories, publishedMinorDegrees, prereqLinks };
};
