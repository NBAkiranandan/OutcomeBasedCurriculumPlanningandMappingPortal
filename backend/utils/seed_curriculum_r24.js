import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Program from '../models/Program.js';
import Department from '../models/Department.js';
import Regulation from '../models/Regulation.js';
import Course from '../models/Course.js';
import CourseVersion from '../models/CourseVersion.js';
import PeoPso from '../models/PeoPso.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/obcpmp';

const courses = [
  // Semester 1
  { code: '241MA001', title: 'Linear Algebra & Calculus', semester: 1, credits: { L: 2, T: 1, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Foundation' },
  { code: '241CH002', title: 'Applied Chemistry', semester: 1, credits: { L: 2, T: 1, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Foundation' },
  { code: '241PH002', title: 'Modern Physics', semester: 1, credits: { L: 2, T: 1, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Foundation' },
  { code: '241ME001', title: 'Engineering Graphics', semester: 1, credits: { L: 1, T: 2, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Foundation' },
  { code: '241CS001', title: 'Programming for Problem Solving Using C', semester: 1, credits: { L: 2, T: 0, P: 2, S: 0, C: 4 }, category: 'MCC', level: 'Foundation' },
  { code: '241ME003', title: 'Engineering Workshop', semester: 1, credits: { L: 1, T: 0, P: 1, S: 0, C: 2 }, category: 'MCC', level: 'Foundation' },

  // Semester 2
  { code: '241MA002', title: 'Differential Equations & Vector Calculus', semester: 2, credits: { L: 2, T: 1, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Foundation' },
  { code: '241CS003', title: 'Data Structures', semester: 2, credits: { L: 2, T: 0, P: 2, S: 0, C: 4 }, category: 'MCC', level: 'Foundation' },
  { code: '241IT001', title: 'IT & AI Skills', semester: 2, credits: { L: 0, T: 0, P: 2, S: 0, C: 2 }, category: 'SEC', level: 'Foundation' },
  { code: '241AI006', title: 'Digital Logic & Computer Organization', semester: 2, credits: { L: 2, T: 1, P: 0, S: 0, C: 3 }, category: 'MDC', level: 'Foundation' },
  { code: '241EE001', title: 'Basic Electrical & Electronics Engineering', semester: 2, credits: { L: 2, T: 1, P: 0, S: 0, C: 3 }, category: 'MDC', level: 'Foundation' },
  { code: '241HS002', title: 'English Communication', semester: 2, credits: { L: 1, T: 0, P: 1, S: 0, C: 2 }, category: 'AEC', level: 'Foundation' },

  // Semester 3
  { code: '241MA008', title: 'Discrete Mathematics', semester: 3, credits: { L: 2, T: 1, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Intermediate' },
  { code: '241IT005', title: 'Database Management Systems', semester: 3, credits: { L: 2, T: 0, P: 2, S: 0, C: 4 }, category: 'MCC', level: 'Intermediate' },
  { code: '241CS008', title: 'Object Oriented Programming in C++', semester: 3, credits: { L: 2, T: 0, P: 2, S: 0, C: 4 }, category: 'MCC', level: 'Intermediate' },
  { code: '241MA009', title: 'Probability & Statistics', semester: 3, credits: { L: 2, T: 1, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Intermediate' },
  { code: '241IT006', title: 'Java Programming', semester: 3, credits: { L: 2, T: 0, P: 2, S: 0, C: 4 }, category: 'MCC', level: 'Intermediate' },
  { code: '241HS003', title: 'Professional Ethics and Human Values', semester: 3, credits: { L: 2, T: 0, P: 0, S: 0, C: 2 }, category: 'MC', level: 'Foundation' },

  // Semester 4
  { code: '241CS011', title: 'Theory of Computation', semester: 4, credits: { L: 3, T: 0, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Intermediate' },
  { code: '241CS013', title: 'Operating Systems', semester: 4, credits: { L: 3, T: 0, P: 1, S: 0, C: 4 }, category: 'MCC', level: 'Intermediate' },
  { code: '241AI002', title: 'Artificial Intelligence', semester: 4, credits: { L: 2, T: 1, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Intermediate' },
  { code: '241IT007', title: 'Agile Software Engineering', semester: 4, credits: { L: 2, T: 0, P: 0, S: 0, C: 2 }, category: 'MCC', level: 'Intermediate' },
  { code: '241CS007', title: 'Computer Networks', semester: 4, credits: { L: 2, T: 1, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Intermediate' },
  { code: '241HS004', title: 'Environmental Science', semester: 4, credits: { L: 2, T: 0, P: 0, S: 0, C: 2 }, category: 'MC', level: 'Foundation' },

  // Semester 5
  { code: '241CS015', title: 'Software Architecture', semester: 5, credits: { L: 3, T: 0, P: 1, S: 0, C: 4 }, category: 'MCC', level: 'Advanced' },
  { code: '241CS010', title: 'Advanced Data Structures and Algorithms', semester: 5, credits: { L: 3, T: 0, P: 1, S: 0, C: 4 }, category: 'MCC', level: 'Advanced' },
  { code: '241AI003', title: 'Data Mining', semester: 5, credits: { L: 2, T: 0, P: 1, S: 0, C: 3 }, category: 'MCC', level: 'Advanced' },
  { code: '241IT003', title: 'Cryptography & Network Security', semester: 5, credits: { L: 2, T: 1, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Advanced' },
  { code: '241IT004', title: 'Compiler Design', semester: 5, credits: { L: 3, T: 0, P: 0, S: 0, C: 3 }, category: 'MCC', level: 'Advanced' },
  { code: '241VAC001', title: 'Value Added Course', semester: 5, credits: { L: 0, T: 0, P: 0, S: 0, C: 2 }, category: 'VAC', level: 'Advanced' },

  // Semester 6
  { code: '241AI004', title: 'Big Data Analytics', semester: 6, credits: { L: 2, T: 0, P: 1, S: 0, C: 3 }, category: 'MCC', level: 'Advanced' },
  { code: '241AI005', title: 'Machine Learning', semester: 6, credits: { L: 2, T: 0, P: 1, S: 0, C: 3 }, category: 'MCC', level: 'Advanced' },
  { code: '241SEC001', title: 'Skill Enhancement Course', semester: 6, credits: { L: 0, T: 0, P: 2, S: 0, C: 2 }, category: 'SEC', level: 'Advanced' },
  { code: '241MC001', title: 'Mandatory Audit Course', semester: 6, credits: { L: 0, T: 0, P: 0, S: 0, C: 2 }, category: 'MC', level: 'Advanced' },

  // Semester 7
  { code: '241SI001', title: 'Summer Internship', semester: 7, credits: { L: 0, T: 0, P: 0, S: 0, C: 6 }, category: 'SI', level: 'Advanced' },
  { code: '241VA002', title: 'Value Added Professional Course', semester: 7, credits: { L: 0, T: 0, P: 0, S: 0, C: 2 }, category: 'VAC', level: 'Advanced' },
  { code: '241MC002', title: 'Mandatory Workshop', semester: 7, credits: { L: 0, T: 0, P: 0, S: 0, C: 2 }, category: 'MC', level: 'Advanced' },

  // Semester 8
  { code: '241PR001', title: 'Project Work', semester: 8, credits: { L: 0, T: 0, P: 0, S: 0, C: 12 }, category: 'PROJ', level: 'Advanced' },
  { code: '241CS020', title: 'Industry Oriented Elective', semester: 8, credits: { L: 2, T: 0, P: 0, S: 0, C: 2 }, category: 'MCC', level: 'Advanced' },
  { code: '241CS021', title: 'Research Seminar', semester: 8, credits: { L: 0, T: 0, P: 0, S: 0, C: 2 }, category: 'MC', level: 'Advanced' }
];

const getCoursePayload = (record) => ({
  courseId: record.courseId,
  regulationId: record.regulationId,
  semester: record.semester,
  credits: record.credits,
  category: record.category,
  level: record.level,
  objectives: [`Understand the fundamentals of ${record.title}.`],
  status: 'Approved'
});

const seed = async () => {
  try {
    console.log('[seed_curriculum_r24] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('[seed_curriculum_r24] Connected to MongoDB');

    let program = await Program.findOne({ code: 'B.Tech' });
    if (!program) {
      program = await Program.create({
        name: 'Bachelor of Technology',
        code: 'B.Tech',
        description: 'Undergraduate engineering program',
        totalCredits: 160,
        duration: 4,
        isActive: true
      });
      console.log('[seed_curriculum_r24] Created B.Tech program');
    }

    let regulation = await Regulation.findOne({ code: 'R24' });
    if (!regulation) {
      regulation = await Regulation.create({
        code: 'R24',
        academicYear: 2024,
        programId: program._id,
        durationYears: 4,
        semesterCount: 8,
        status: 'Published',
        version: 1,
        isActive: true
      });
      console.log('[seed_curriculum_r24] Created R24 regulation');
    } else {
      if (!regulation.programId) {
        regulation.programId = program._id;
        await regulation.save();
        console.log('[seed_curriculum_r24] Updated existing R24 regulation with programId');
      }
      console.log('[seed_curriculum_r24] Using existing R24 regulation');
    }

    let department = await Department.findOne({ code: 'CSE' });
    if (!department) {
      department = await Department.create({
        name: 'Computer Science & Engineering',
        code: 'CSE',
        programId: program._id,
        regulationId: regulation._id,
        description: 'Computer Science and Engineering department for B.Tech R24',
        isActive: true
      });
      console.log('[seed_curriculum_r24] Created CSE department');
    } else {
      if (!department.programId || !department.programId.equals(program._id)) {
        department.programId = program._id;
      }
      if (!department.regulationId || !department.regulationId.equals(regulation._id)) {
        department.regulationId = regulation._id;
      }
      await department.save();
      console.log('[seed_curriculum_r24] Using existing CSE department');
    }

    console.log('[seed_curriculum_r24] Clearing existing R24 CourseVersions...');
    await CourseVersion.deleteMany({ regulationId: regulation._id });

    const peoPsoExists = await PeoPso.findOne({ departmentId: department._id });
    if (!peoPsoExists) {
      await PeoPso.create({
        departmentId: department._id,
        peos: [
          { code: 'PEO1', description: 'Graduate with strong fundamentals in mathematics, science and engineering.' },
          { code: 'PEO2', description: 'Develop professional ethics, communication skills, and leadership abilities.' },
          { code: 'PEO3', description: 'Innovate and adapt to evolving technologies through lifelong learning.' }
        ],
        psos: [
          { code: 'PSO1', description: 'Solve real world problems using software engineering tools and practices.' },
          { code: 'PSO2', description: 'Design systems for reliability, security, and sustainability.' },
          { code: 'PSO3', description: 'Apply data science and artificial intelligence methods to extract insights.' }
        ],
        pos: []
      });
      console.log('[seed_curriculum_r24] Seeded R24 PEO/PSO definitions');
    } else {
      console.log('[seed_curriculum_r24] Using existing PEO/PSO definitions');
    }

    let totalVersions = 0;
    for (const item of courses) {
      let course = await Course.findOne({ code: item.code });
      if (!course) {
        course = await Course.create({
          code: item.code,
          title: item.title,
          departmentId: department._id
        });
      }

      await CourseVersion.create({
        courseId: course._id,
        regulationId: regulation._id,
        semester: item.semester,
        credits: item.credits,
        category: item.category,
        level: item.level,
        objectives: [`To understand the fundamentals of ${item.title}.`],
        description: item.title,
        status: 'Approved'
      });
      totalVersions += 1;
    }

    console.log(`[seed_curriculum_r24] Seeded ${totalVersions} CourseVersion records for R24`);
    process.exit(0);
  } catch (error) {
    console.error('[seed_curriculum_r24] Error seeding curriculum:', error);
    process.exit(1);
  }
};

seed();
