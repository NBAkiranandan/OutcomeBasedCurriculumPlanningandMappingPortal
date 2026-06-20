import mongoose from 'mongoose';
import CourseCategory from './models/CourseCategory.js';

mongoose.connect('mongodb://127.0.0.1:27017/obcpmp');

const defaultCategories = [
  { code: 'MCC', name: 'Major Core Courses (MCC )', ugc: '80' },
  { code: 'MSC/UEC', name: 'Minor Stream Courses (MSC)\n(or)\nUniversity Open Elective Courses (UEC)', ugc: '32' },
  { code: 'MDC', name: 'Multidisciplinary Courses (MDC)', ugc: '9' },
  { code: 'AEC', name: 'Ability Enhancement Courses (AEC)', ugc: '8' },
  { code: 'SEC', name: 'Skill Enhancement Courses (SEC)', ugc: '9' },
  { code: 'VAC', name: 'Value Added Courses (VAC)', ugc: '6-8' },
  { code: 'SI', name: 'Summer Internships (SI)', ugc: '2-4' },
  { code: 'PROJ', name: 'Full Semester Internship (PROJ)', ugc: '12' },
  { code: 'MC', name: 'Mandatory Courses (MC)', ugc: '' }
];

const seed = async () => {
  await CourseCategory.deleteMany({});
  await CourseCategory.insertMany(defaultCategories);
  console.log('Categories seeded successfully');
  mongoose.connection.close();
};

seed();
