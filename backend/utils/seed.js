import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';
import Program from '../models/Program.js';
import Department from '../models/Department.js';
import CourseCategory from '../models/CourseCategory.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/obcpmp';

const seedDatabase = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected successfully.');

    console.log('[Seed] Dropping database for a clean slate...');
    await mongoose.connection.db.dropDatabase();

    // 1. Create Program
    console.log('[Seed] Seeding Program...');
    const program = await Program.create({
      name: 'B.Tech',
      code: 'BTECH',
      description: 'Bachelor of Technology',
      degree: 'Undergraduate',
      duration: 4,
      numberOfSemesters: 8,
      totalCredits: 160
    });

    // 2. Create Department
    console.log('[Seed] Seeding Department...');
    const department = await Department.create({
      name: 'Computer Science and Engineering',
      code: 'CSE',
      programId: program._id,
      description: 'Department of Computer Science and Engineering'
    });

    // 3. Create Default Users (One for each role)
    console.log('[Seed] Seeding Users...');
    const defaultPassword = 'password123'; // The pre-save hook in User model will hash this

    const users = await User.create([
      {
        name: 'System Administrator',
        email: 'admin@aditya.edu.in',
        password: defaultPassword,
        role: 'Admin',
        departmentId: department._id,
        programId: program._id
      },
      {
        name: 'CSE HOD',
        email: 'hod@aditya.edu.in',
        password: defaultPassword,
        role: 'HOD',
        departmentId: department._id,
        programId: program._id
      },
      {
        name: 'Curriculum Coordinator',
        email: 'coordinator@aditya.edu.in',
        password: defaultPassword,
        role: 'Coordinator',
        departmentId: department._id,
        programId: program._id
      },
      {
        name: 'Faculty Member',
        email: 'faculty@aditya.edu.in',
        password: defaultPassword,
        role: 'Faculty',
        departmentId: department._id,
        programId: program._id
      }
    ]);

    // Link HOD to Department
    department.hodId = users[1]._id;
    await department.save();

    // 4. Create Course Categories
    console.log('[Seed] Seeding Course Categories...');
    const categories = [
      { code: 'BSC', name: 'Basic Science Courses' },
      { code: 'ESC', name: 'Engineering Science Courses' },
      { code: 'HSMC', name: 'Humanities and Social Sciences' },
      { code: 'PCC', name: 'Professional Core Courses' },
      { code: 'PEC', name: 'Professional Elective Courses' },
      { code: 'OEC', name: 'Open Elective Courses' },
      { code: 'PROJ', name: 'Project Work / Internship' },
      { code: 'MC', name: 'Mandatory Courses' },
      { code: 'SEC', name: 'Skill Enhancement Courses' },
      { code: 'VAC', name: 'Value Added Courses' }
    ];
    await CourseCategory.create(categories);

    console.log('[Seed] Successfully seeded database!');
    console.log('--- Default Accounts ---');
    console.log('Admin:       admin@aditya.edu.in       / password123');
    console.log('HOD:         hod@aditya.edu.in         / password123');
    console.log('Coordinator: coordinator@aditya.edu.in / password123');
    console.log('Faculty:     faculty@aditya.edu.in     / password123');
    console.log('------------------------');

  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('[Seed] Database connection closed.');
    process.exit(0);
  }
};

seedDatabase();
