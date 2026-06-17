import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import Program from '../models/Program.js';
import Department from '../models/Department.js';
import Regulation from '../models/Regulation.js';
import Course from '../models/Course.js';
import CourseVersion from '../models/CourseVersion.js';
import PeoPso from '../models/PeoPso.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/obcpmp';
const jsonPath = "C:\\Users\\nikhi\\antigravity_parsed.json"; // Let's use a simpler path or relative, wait, let's use the exact path passed as an argument or absolute path.
const exactJsonPath = "C:\\Users\\nikhi\\.gemini\\antigravity-ide\\brain\\c5644a08-ea41-4266-8155-19d7110f1f2b\\scratch\\parsed_curriculum.json";

const getValidCategory = (cat) => {
  const valid = ['PC', 'PE', 'OE', 'BS', 'ES', 'HS', 'MC'];
  if (valid.includes(cat)) return cat;
  if (cat === 'SEC') return 'PC';
  if (cat === 'VAC') return 'MC';
  if (cat === 'SI') return 'PC';
  if (cat === 'MDC') return 'ES';
  if (cat === 'AEC') return 'HS';
  return 'PC';
};

const loadData = async () => {
  try {
    console.log('[R24 Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[R24 Seed] Connected.');

    // 1. Get or create Program (B.Tech)
    let btech = await Program.findOne({ code: 'B.Tech' });
    if (!btech) {
      btech = await Program.create({
        name: 'Engineering',
        code: 'B.Tech',
        description: 'Bachelor of Technology programs'
      });
      console.log('[R24 Seed] Created B.Tech Program.');
    }

    // 2. Delete existing R24 Regulation and CourseVersions to allow clean re-runs
    const existingReg = await Regulation.findOne({ code: 'R24', programId: btech._id });
    if (existingReg) {
      console.log('[R24 Seed] Removing existing R24 CourseVersions...');
      await CourseVersion.deleteMany({ regulationId: existingReg._id });
      console.log('[R24 Seed] Removing existing R24 Regulation...');
      await Regulation.deleteOne({ _id: existingReg._id });
    }

    // 3. Create R24 Regulation
    let r24Regulation = await Regulation.create({
      code: 'R24',
      academicYear: 2024,
      programId: btech._id,
      durationYears: 4,
      semesterCount: 8,
      isActive: true
    });
    console.log('[R24 Seed] Created R24 Regulation.');

    // 4. Get or create Department (CSE)
    let cse = await Department.findOne({ code: 'CSE', programId: btech._id, regulationId: r24Regulation._id });
    if (!cse) {
      console.log('Creating CSE Department...');
      cse = await Department.create({
        name: 'Computer Science & Engineering',
        code: 'CSE',
        programId: btech._id,
        regulationId: r24Regulation._id,
        description: 'B.Tech CSE Department R24',
        isActive: true
      });
      console.log('[R24 Seed] Created CSE Department.');
    }

    // Seed PEO/PSO matrices for R24
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
    await PeoPso.deleteMany({ regulationId: r24Regulation._id });
    await PeoPso.create({
      regulationId: r24Regulation._id,
      peos: csePEOs,
      psos: csePSOs,
      pos: standardPOs
    });
    console.log('[R24 Seed] Populated PEO/PSO matrices.');

    // 5. Read parsed JSON data
    console.log(`[R24 Seed] Reading parsed curriculum from ${exactJsonPath}...`);
    const fileContent = fs.readFileSync(exactJsonPath, 'utf8');
    const parsedData = JSON.parse(fileContent);
    const { courses, catalog } = parsedData;

    console.log(`[R24 Seed] Found ${Object.keys(courses).length} courses to load.`);

    // 6. Iterate and insert
    let coursesSeededCount = 0;
    for (const [code, courseData] of Object.entries(courses)) {
      const catalogInfo = catalog[code] || { semester: 1, category: 'PC' };

      // Find or create Course
      let course = await Course.findOne({ code });
      if (!course) {
        course = await Course.create({
          code,
          title: courseData.title || 'Untitled Course',
          departmentId: cse._id
        });
      }

      // Prepare default objectives if none parsed
      const objectives = [
        `To understand the primary concepts and applications of ${courseData.title}.`,
        `To introduce student to core theories and tools in ${course.code}.`,
        `To formulate solutions utilizing state-of-the-art mechanisms.`
      ];

      // Prepare CourseVersion
      const versionPayload = {
        courseId: course._id,
        regulationId: r24Regulation._id,
        semester: catalogInfo.semester,
        credits: {
          L: courseData.credits?.L ?? 3,
          T: courseData.credits?.T ?? 0,
          P: courseData.credits?.P ?? 0,
          S: courseData.credits?.S ?? 0,
          C: courseData.credits?.C ?? 3
        },
        category: getValidCategory(catalogInfo.category),
        objectives: objectives,
        prerequisites: [],
        description: `${courseData.title} program structure course under R24 regulation.`,
        status: 'Approved', // Auto-publish R24 curriculum
        assignedCoordinator: null,
        courseOutcomes: courseData.courseOutcomes || [],
        coPoMappings: courseData.coPoMappings || [],
        coPsoMappings: courseData.coPsoMappings || [],
        syllabusUnits: courseData.syllabusUnits || [],
        labPracticals: courseData.labPracticals || [],
        textbooks: (courseData.textbooks || []).map(tb => typeof tb === 'string' ? { title: tb } : tb),
        referenceMaterials: (courseData.referenceMaterials || []).map(rm => typeof rm === 'string' ? { title: rm } : rm),
        cieSee: {
          cieMaxMarks: 50,
          seeMaxMarks: 50,
          cieBreakup: 'Continuous Internal Evaluation (50 marks)',
          seeBreakup: 'Semester End Examination (50 marks)'
        }
      };

      await CourseVersion.create(versionPayload);
      coursesSeededCount++;
    }

    console.log(`[R24 Seed] Successfully seeded ${coursesSeededCount} courses under Regulation R24.`);
    process.exit(0);
  } catch (err) {
    console.error(`[R24 Seed Error] Failed to seed R24 database:`, err);
    process.exit(1);
  }
};

loadData();
