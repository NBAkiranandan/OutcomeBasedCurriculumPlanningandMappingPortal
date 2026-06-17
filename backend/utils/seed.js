import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Program from '../models/Program.js';
import Department from '../models/Department.js';
import Regulation from '../models/Regulation.js';
import Course from '../models/Course.js';
import CourseVersion from '../models/CourseVersion.js';
import PeoPso from '../models/PeoPso.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/obcpmp';

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected.');

    // Clear existing data
    console.log('[Seed] Cleaning existing data...');
    await User.deleteMany({});
    await Program.deleteMany({});
    await Department.deleteMany({});
    await Regulation.deleteMany({});
    await Course.deleteMany({});
    await CourseVersion.deleteMany({});
    await PeoPso.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    console.log('[Seed] Clean completed.');

    // 1. Create Programs
    console.log('[Seed] Creating Programs...');
    const btechProgram = await Program.create({
      name: 'Engineering',
      code: 'B.Tech',
      description: 'Bachelor of Technology programs'
    });
    
    const mbaProgram = await Program.create({
      name: 'Management',
      code: 'MBA',
      description: 'Master of Business Administration programs'
    });

    const bpharmProgram = await Program.create({
      name: 'Pharmacy',
      code: 'B.Pharm',
      description: 'Bachelor of Pharmacy programs'
    });

    const mbbsProgram = await Program.create({
      name: 'Medical',
      code: 'MBBS',
      description: 'Bachelor of Medicine and Bachelor of Surgery'
    });
    
    console.log('[Seed] Programs created.');

    // 2. Create Regulations
    console.log('[Seed] Creating Regulations...');
    const r23Regulation = await Regulation.create({
      code: 'R23',
      academicYear: 2023,
      programId: btechProgram._id,
      durationYears: 4,
      semesterCount: 8,
      isActive: true
    });

    const r25Regulation = await Regulation.create({
      code: 'R25',
      academicYear: 2025,
      programId: btechProgram._id,
      durationYears: 4,
      semesterCount: 8,
      isActive: true
    });

    const r24MbaRegulation = await Regulation.create({
      code: 'R24',
      academicYear: 2024,
      programId: mbaProgram._id,
      durationYears: 2,
      semesterCount: 4,
      isActive: true
    });
    
    console.log('[Seed] Regulations created.');

    // 3. Create Departments
    console.log('[Seed] Creating Departments...');
    const [cseDept, eceDept, mbaDept] = await Department.insertMany([
      {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        programId: btechProgram._id,
        regulationId: r23Regulation._id,
        description: 'B.Tech CSE Department',
        isActive: true
      },
      {
        name: 'Electronics & Communication Engineering',
        code: 'ECE',
        programId: btechProgram._id,
        regulationId: r23Regulation._id,
        description: 'B.Tech ECE Department',
        isActive: true
      },
      {
        name: 'Business Administration',
        code: 'MBA',
        programId: mbaProgram._id,
        regulationId: r24MbaRegulation._id,
        description: 'MBA Department',
        isActive: true
      }
    ]);

    console.log('[Seed] Departments created.');

    // 4. Create Users
    console.log('[Seed] Creating Users...');
    
    const adminUser = await User.create({
      name: 'Dr. K. V. S. R. Murthy',
      email: 'admin@aditya.edu.in',
      password: 'admin123',
      role: 'Admin',
      isActive: true
    });

    const hodUser = await User.create({
      name: 'Dr. M. Sreenivasa Rao',
      email: 'hod.cse@aditya.edu.in',
      password: 'hod123',
      role: 'HOD',
      departmentId: cseDept._id,
      programId: btechProgram._id,
      isActive: true
    });

    const coordinatorUser = await User.create({
      name: 'Mr. N. Ramanjaneyulu',
      email: 'coord.cse@aditya.edu.in',
      password: 'coord123',
      role: 'Coordinator',
      departmentId: cseDept._id,
      programId: btechProgram._id,
      isActive: true
    });

    const facultyUser = await User.create({
      name: 'Ms. S. Anusha',
      email: 'faculty.cse@aditya.edu.in',
      password: 'faculty123',
      role: 'Faculty',
      departmentId: cseDept._id,
      programId: btechProgram._id,
      isActive: true
    });

    console.log('[Seed] Users created.');

    // 5. Create PEOs, PSOs, and standard POs for CSE R23 & R25
    console.log('[Seed] Seeding PEOs, PSOs, POs...');
    const standardPOs = [
      { code: 'PO1', description: 'Engineering Knowledge: Apply knowledge of mathematics, science, and engineering fundamentals.' },
      { code: 'PO2', description: 'Problem Analysis: Identify, formulate, and analyze complex engineering problems.' },
      { code: 'PO3', description: 'Design/Development of Solutions: Design solutions for complex engineering problems.' },
      { code: 'PO4', description: 'Conduct Investigations: Use research-based knowledge and research methods.' },
      { code: 'PO5', description: 'Modern Tool Usage: Create, select, and apply appropriate techniques and resources.' },
      { code: 'PO6', description: 'The Engineer and Society: Apply reasoning informed by contextual knowledge.' },
      { code: 'PO7', description: 'Environment and Sustainability: Understand the impact of engineering solutions.' },
      { code: 'PO8', description: 'Ethics: Apply ethical principles and commit to professional ethics.' },
      { code: 'PO9', description: 'Individual and Team Work: Function effectively as an individual or team member.' },
      { code: 'PO10', description: 'Communication: Communicate effectively on complex engineering activities.' },
      { code: 'PO11', description: 'Project Management & Finance: Demonstrate knowledge and understanding of management principles.' },
      { code: 'PO12', description: 'Life-long Learning: Recognize the need for, and have the preparation to engage in lifelong learning.' }
    ];

    const csePEOs = [
      { code: 'PEO1', description: 'Core Competence: Provide graduates with a solid foundation in mathematical, scientific, and engineering fundamentals.' },
      { code: 'PEO2', description: 'Professionalism: Inculcate professional and ethical attitude, communication skills, and team work capabilities.' },
      { code: 'PEO3', description: 'Life-long Learning: Equip graduates to pursue higher studies, research, or adapt to emerging technological trends.' }
    ];

    const csePSOs = [
      { code: 'PSO1', description: 'Software Development: Ability to design, program, and maintain enterprise software solutions using modern environments.' },
      { code: 'PSO2', description: 'System Design: Apply architectural principles to configure cloud platforms, network networks, and security setups.' },
      { code: 'PSO3', description: 'Data Intelligence: Apply data science, machine learning, and optimization principles to draw actionable insights.' }
    ];

    await PeoPso.create({
      departmentId: cseDept._id,
      peos: csePEOs,
      psos: csePSOs,
      pos: standardPOs
    });

    console.log('[Seed] PEO/PSO/PO matrices populated.');

    // 6. Create Courses & CourseVersions
    console.log('[Seed] Seeding Courses & Syllabus versions...');
    
    // Course 1: DBMS
    const dbmsCourse = await Course.create({
      code: 'CS203',
      title: 'Database Management Systems',
      departmentId: cseDept._id
    });

    // Course 2: CN
    const cnCourse = await Course.create({
      code: 'CS204',
      title: 'Computer Networks',
      departmentId: cseDept._id
    });

    // Course 3: DS
    const dsCourse = await Course.create({
      code: 'CS102',
      title: 'Data Structures & Algorithms',
      departmentId: cseDept._id
    });

    // Course 4: WT
    const wtCourse = await Course.create({
      code: 'CS301',
      title: 'Web Technologies',
      departmentId: cseDept._id
    });

    // DBMS Course Outcomes (COs)
    const dbmsCOs = [
      { coCode: 'CO1', description: 'Identify and analyze database system architecture, schemas, and relational models.', bloomLevel: 'K2 - Understand' },
      { coCode: 'CO2', description: 'Formulate relational algebra assertions and construct advanced SQL queries.', bloomLevel: 'K3 - Apply' },
      { coCode: 'CO3', description: 'Design database schemas applying formal normalization theory up to BCNF.', bloomLevel: 'K4 - Analyze' },
      { coCode: 'CO4', description: 'Explain transaction properties, lock protocols, and database recovery pipelines.', bloomLevel: 'K2 - Understand' },
      { coCode: 'CO5', description: 'Construct indexes (B+ Trees) and develop query optimization strategies.', bloomLevel: 'K6 - Create' }
    ];

    // DBMS CO-PO Mappings
    const dbmsCoPo = [
      { coCode: 'CO1', po: { PO1: 3, PO2: 2, PO12: 1 } },
      { coCode: 'CO2', po: { PO1: 3, PO2: 3, PO3: 2, PO5: 2 } },
      { coCode: 'CO3', po: { PO1: 2, PO2: 3, PO3: 3, PO4: 2 } },
      { coCode: 'CO4', po: { PO1: 3, PO2: 2 } },
      { coCode: 'CO5', po: { PO1: 2, PO2: 3, PO3: 3, PO5: 3, PO12: 2 } }
    ];

    // DBMS CO-PSO Mappings
    const dbmsCoPso = [
      { coCode: 'CO1', pso: { PSO1: 2 } },
      { coCode: 'CO2', pso: { PSO1: 3, PSO3: 2 } },
      { coCode: 'CO3', pso: { PSO1: 3, PSO2: 2 } },
      { coCode: 'CO4', pso: { PSO2: 1 } },
      { coCode: 'CO5', pso: { PSO1: 2, PSO3: 3 } }
    ];

    // DBMS Syllabus Units
    const dbmsUnits = [
      {
        unitNumber: 1,
        title: 'Introduction & Entity Relationship Model',
        description: 'Covers database management basics compared to legacy file systems, system architecture, ER schemas, and key definitions.',
        topics: [
          'Database System Applications and Core Purpose',
          'Database vs File Processing Systems',
          'Data Views, Data Abstraction layers, and Schemas',
          'ER Modeling: Entities, Attributes, Relationships, Constraints, Keys',
          'Extended ER Features: Specialization, Generalization, Aggregation'
        ],
        outcomes: 'Differentiate DBMS from file processes and design comprehensive ER charts for enterprise systems.',
        hours: 10
      },
      {
        unitNumber: 2,
        title: 'Relational Model & Relational Algebra & SQL',
        description: 'Introduces formal mathematical representations of queries and practical SQL languages.',
        topics: [
          'Structure of Relational Databases',
          'Relational Algebra: Select, Project, Join, Set Operations, Cartesian Product',
          'SQL Basics: DDL, DML, DCL, TCL syntax',
          'Nested Subqueries, Triggers, Views, and Integrity Constraints'
        ],
        outcomes: 'Formulate complex queries utilizing relational algebra and deploy secure relational databases via SQL commands.',
        hours: 12
      },
      {
        unitNumber: 3,
        title: 'Relational Database Design & Normalization',
        description: 'Syllabus centering on relational schema structures, eliminating redundancy and insert/delete anomalies.',
        topics: [
          'Pitfalls in Relational Database Design',
          'Functional Dependencies: Armstongs axioms, closure set',
          'Normal Forms: First, Second, Third Normal Form (1NF, 2NF, 3NF)',
          'Boyce-Codd Normal Form (BCNF), Decomposition properties (Lossless and Dependency preserving)'
        ],
        outcomes: 'Inspect relational schemas and execute normalization up to BCNF to ensure zero data redundancy.',
        hours: 11
      },
      {
        unitNumber: 4,
        title: 'Transaction Processing & Concurrency Control',
        description: 'Focuses on database stability, consistency, lock managers, and log-based restoration structures.',
        topics: [
          'Transaction Concept, States, ACID properties, Serializability schedules',
          'Concurrency Control: Lock-Based Protocols, Two-Phase Locking (2PL)',
          'Timestamp-Based Protocols, Deadlocks recovery',
          'Database Recovery: Log-based recovery mechanisms, Checkpoints'
        ],
        outcomes: 'Assess transaction safety and construct locks to ensure concurrent execution integrity.',
        hours: 10
      },
      {
        unitNumber: 5,
        title: 'Indexing, Storage & Query Processing',
        description: 'Physical storage structure optimization, disk block access mechanisms, B+ trees, and optimization paths.',
        topics: [
          'File Organizations, Primary, Secondary, Clustering Indexes',
          'B-Trees and B+ Trees Indexing Structures',
          'Query Optimization: Cost estimation, execution plans, heuristics'
        ],
        outcomes: 'Analyze search latency and construct appropriate B+ trees indexing strategies to optimize querying workloads.',
        hours: 9
      }
    ];

    // Seed R23 DBMS CourseVersion
    const r23Dbms = await CourseVersion.create({
      courseId: dbmsCourse._id,
      regulationId: r23Regulation._id,
      semester: 4,
      credits: { L: 3, T: 0, P: 0, S: 0, C: 3 },
      category: 'PC',
      objectives: [
        'To learn the fundamental concepts of database system architecture.',
        'To implement schema management via Relational Algebra and structured SQL queries.',
        'To study functional dependencies and schema normalization guidelines.',
        'To understand transaction mechanisms, concurrency controls, and database recovery pipelines.'
      ],
      prerequisites: ['CS102 (Data Structures & Algorithms)'],
      status: 'Approved', // Already fully approved in legacy regulation
      assignedCoordinator: coordinatorUser._id,
      courseOutcomes: dbmsCOs,
      coPoMappings: dbmsCoPo,
      coPsoMappings: dbmsCoPso,
      syllabusUnits: dbmsUnits,
      textbooks: [
        { title: 'Database System Concepts, Silberschatz, Korth, Sudarshan, 7th Edition, McGraw Hill.' },
        { title: 'Fundamentals of Database Systems, Elmasri, Navathe, 7th Edition, Pearson Education.' }
      ],
      referenceMaterials: [
        { title: 'Database Management Systems, Raghu Ramakrishnan, Johannes Gehrke, 3rd Edition, McGraw Hill.' },
        { title: 'Database Systems: The Complete Book, Hector Garcia-Molina, Jeffrey D. Ullman, Jennifer Widom, 2nd Edition, Pearson.' }
      ],
      cieSee: {
        cieMaxMarks: 40,
        seeMaxMarks: 60,
        cieBreakup: 'Continuous Evaluation includes 2 Mid-term Exams (30 Marks), 1 Assignment (5 Marks), and 1 Quiz (5 Marks).',
        seeBreakup: 'Semester End Examination will contain Part A (10 compulsory short-answer questions, 2 marks each) and Part B (5 analytical long-answer questions, 8 marks each).'
      }
    });

    // Seed R25 DBMS CourseVersion (In Draft status, pending coordinator progress)
    await CourseVersion.create({
      courseId: dbmsCourse._id,
      regulationId: r25Regulation._id,
      semester: 4,
      credits: { L: 3, T: 0, P: 0, S: 1, C: 4 }, // Updated credits in R25 to include a Skill (S) credit!
      category: 'PC',
      objectives: [
        'To learn the fundamental concepts of database system architecture.',
        'To implement schema management via Relational Algebra and structured SQL queries.',
        'To study functional dependencies and schema normalization guidelines.',
        'To analyze recovery protocols and advanced NoSQL paradigms.'
      ],
      prerequisites: ['CS102 (Data Structures)'],
      status: 'Draft', // In Draft so Coordinator can play with the dashboard!
      assignedCoordinator: coordinatorUser._id,
      courseOutcomes: dbmsCOs,
      coPoMappings: dbmsCoPo,
      coPsoMappings: dbmsCoPso,
      syllabusUnits: dbmsUnits,
      textbooks: [
        { title: 'Database System Concepts, Silberschatz, Korth, Sudarshan, 7th Edition, McGraw Hill.' },
        { title: 'Fundamentals of Database Systems, Elmasri, Navathe, 7th Edition, Pearson Education.' }
      ],
      referenceMaterials: [
        { title: 'Database Management Systems, Raghu Ramakrishnan, Johannes Gehrke, 3rd Edition, McGraw Hill.' }
      ],
      cieSee: {
        cieMaxMarks: 40,
        seeMaxMarks: 60,
        cieBreakup: '2 Mid Exams (30 marks), Online Quiz (5 marks) and Practical implementation lab tasks (5 marks)',
        seeBreakup: 'Standard theory exam'
      }
    });

    // Seed Data Structures R23 (Approved)
    const dsCOs = [
      { coCode: 'CO1', description: 'Analyze performance of sorting algorithms using asymptotic notations.', bloomLevel: 'K4 - Analyze' },
      { coCode: 'CO2', description: 'Implement linear structures (Stacks, Queues) and apply to parsing.', bloomLevel: 'K3 - Apply' }
    ];
    
    await CourseVersion.create({
      courseId: dsCourse._id,
      regulationId: r23Regulation._id,
      semester: 3,
      credits: { L: 3, T: 0, P: 2, S: 0, C: 4 },
      category: 'PC',
      objectives: ['To teach fundamentals of linear and non-linear data structures.'],
      prerequisites: ['Programming for Problem Solving'],
      status: 'Approved',
      assignedCoordinator: coordinatorUser._id,
      courseOutcomes: dsCOs,
      coPoMappings: [
        { coCode: 'CO1', po: { PO1: 3, PO2: 3 } },
        { coCode: 'CO2', po: { PO1: 3, PO3: 2 } }
      ],
      coPsoMappings: [
        { coCode: 'CO1', pso: { PSO1: 2 } },
        { coCode: 'CO2', pso: { PSO1: 3 } }
      ],
      syllabusUnits: [
        {
          unitNumber: 1,
          title: 'Introduction to Algorithms & Sorting',
          description: 'Basic asymptotic notations, selection sort, bubble sort, quick sort, and merge sort.',
          topics: ['Algorithms definition', 'Big-O notation', 'Recursive algorithms', 'Divide and conquer sorting'],
          outcomes: 'Select ideal sorting paths based on compute constraints.',
          hours: 9
        },
        {
          unitNumber: 2,
          title: 'Stacks and Queues',
          description: 'Linear lists structures and operations.',
          topics: ['Stacks push/pop', 'Infix to postfix conversion', 'Queues enqueue/dequeue', 'Circular queues'],
          outcomes: 'Implement buffer structures using stacks.',
          hours: 10
        }
      ],
      labPracticals: [
        { title: 'Implementation of Quick Sort', hours: 2, description: 'Code standard quick sort program and track operation tallies.' },
        { title: 'Stack operations using pointers', hours: 2, description: 'Code stack structures dynamically via memory pointers.' }
      ],
      textbooks: [{ title: 'Data Structures, Algorithms and Applications in C++, Sartaj Sahni, 2nd Edition.' }],
      referenceMaterials: [{ title: 'Introduction to Algorithms, Thomas Cormen.' }],
      cieSee: {
        cieMaxMarks: 40,
        seeMaxMarks: 60,
        cieBreakup: 'Lab assessments and 2 Mid exams.',
        seeBreakup: 'Theory + practical components'
      }
    });

    // Create Audit Log
    await AuditLog.create({
      action: 'SYSTEM_SEED',
      details: 'System database seeded with initial programs, departments, active regulations, and comprehensive course versions by administrator Murthy.',
      userName: 'Administrator Murthy',
      userEmail: 'admin@aditya.edu.in',
      category: 'Configuration'
    });

    // Seed sample notifications
    console.log('[Seed] Seeding sample notifications...');
    await Notification.create([
      {
        recipientId: coordinatorUser._id,
        title: 'Course Assigned by HOD',
        description: `CS203 Database Management Systems (Regulation R25) has been assigned to you as Course Coordinator by HOD ${hodUser.name}.`,
        category: 'Course Updates',
        type: 'info',
        courseId: dbmsCourse._id
      },
      {
        recipientId: coordinatorUser._id,
        title: 'Deadline Reminder',
        description: 'Syllabus submission deadline for CS203 DBMS is 2026-06-25. Please submit before the deadline.',
        category: 'Course Updates',
        type: 'warning',
        courseId: dbmsCourse._id
      },
      {
        recipientId: coordinatorUser._id,
        title: 'HOD Returned Course',
        description: 'CS203 syllabus file returned for corrections in CO-PO mapping by HOD.',
        category: 'Approval Status',
        type: 'warning',
        courseId: dbmsCourse._id
      },
      {
        recipientId: hodUser._id,
        title: 'Course Submitted for Approval',
        description: 'Syllabus draft for CS203 Database Management Systems has been submitted by coordinator Mr. N. Ramanjaneyulu.',
        category: 'Approval Status',
        type: 'info',
        courseId: dbmsCourse._id
      },
      {
        recipientRole: 'Faculty',
        title: 'Approved Syllabus Published',
        description: 'The approved syllabus for CS102 - Data Structures & Algorithms (R23) is now published.',
        category: 'Course Updates',
        type: 'success',
        courseId: dsCourse._id
      },
      {
        recipientRole: 'Admin',
        title: 'Department Approval Completion',
        description: 'All course versions under B.Tech CSE Regulation R23 have been fully approved by HOD.',
        category: 'System',
        type: 'success'
      }
    ]);

    console.log('[Seed] Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Database seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
