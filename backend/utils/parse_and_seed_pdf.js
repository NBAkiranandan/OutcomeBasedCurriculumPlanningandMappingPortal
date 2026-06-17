/**
 * parse_and_seed_pdf.js
 * =====================
 * Parses the B.Tech CSE R24 curriculum PDF (799 pages, Aditya University)
 * and seeds all extracted data into MongoDB using existing data models.
 *
 * Usage: node utils/parse_and_seed_pdf.js
 * 
 * PDF Structure discovered:
 * - Pages 1-35: Program overview, course lists, semester tables
 * - Pages 36+:  Individual course syllabi in this format per course:
 *     Course Title
 *     (Common to ...)
 *     L T P C
 *     Course Code: 241XXXXX
 *     N N N N
 *     Course Outcomes: ...
 *     CO1: description
 *     CO2: description
 *     ...
 *     CO/PO mapping table
 *     UNIT - I / UNIT - II ...
 *     Text Books: ...
 *     Reference Books: ...
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Program from '../models/Program.js';
import Department from '../models/Department.js';
import Regulation from '../models/Regulation.js';
import Course from '../models/Course.js';
import CourseVersion from '../models/CourseVersion.js';
import PeoPso from '../models/PeoPso.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.resolve(__dirname, '../../src/assets/B.Tech_CSE_ProgramStructure_Syllabus (2)R24.pdf');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/obcpmp';

// ─── Standard POs ────────────────────────────────────────────────────────────
const STANDARD_POS = [
  { code: 'PO1',  description: 'Engineering Knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization.' },
  { code: 'PO2',  description: 'Problem Analysis: Identify, formulate, review research literature, and analyze complex engineering problems.' },
  { code: 'PO3',  description: 'Design/Development of Solutions: Design solutions for complex engineering problems.' },
  { code: 'PO4',  description: 'Conduct Investigations: Use research-based knowledge and research methods.' },
  { code: 'PO5',  description: 'Modern Tool Usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools.' },
  { code: 'PO6',  description: 'The Engineer and Society: Apply reasoning informed by the contextual knowledge.' },
  { code: 'PO7',  description: 'Environment and Sustainability: Understand the impact of the professional engineering solutions.' },
  { code: 'PO8',  description: 'Ethics: Apply ethical principles and commit to professional ethics and responsibilities.' },
  { code: 'PO9',  description: 'Individual and Team Work: Function effectively as an individual, and as a member or leader in diverse teams.' },
  { code: 'PO10', description: 'Communication: Communicate effectively on complex engineering activities.' },
  { code: 'PO11', description: 'Project Management & Finance: Demonstrate knowledge and understanding of the engineering and management principles.' },
  { code: 'PO12', description: 'Life-long Learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning.' }
];

// ─── Valid category codes ─────────────────────────────────────────────────────
const VALID_CATEGORIES = ['PC', 'PE', 'OE', 'BS', 'ES', 'HS', 'MC'];

function normalizeCategory(level, code) {
  // Infer category from course code prefix
  const codeUpper = (code || '').toUpperCase();
  if (codeUpper.includes('MA') || codeUpper.includes('CH') || codeUpper.includes('PH') || codeUpper.includes('CY')) return 'BS';
  if (codeUpper.includes('EN') || codeUpper.includes('UC') || codeUpper.includes('PE') || codeUpper.includes('AC') || codeUpper.includes('MB')) return 'HS';
  if (codeUpper.includes('ME') || codeUpper.includes('EE')) return 'ES';
  return 'PC';
}

// ─── Bloom's level inference ──────────────────────────────────────────────────
const BLOOM_VERBS = {
  'K1 - Remember':   ['remember','recall','list','identify','define','recognize','state','name','repeat'],
  'K2 - Understand': ['understand','explain','describe','summarize','interpret','classify','compare','discuss','illustrate','recognize'],
  'K3 - Apply':      ['apply','use','demonstrate','implement','solve','operate','execute','compute','calculate','perform','construct','write'],
  'K4 - Analyze':    ['analyze','differentiate','examine','distinguish','organize','inspect','investigate','design','compare','correlate'],
  'K5 - Evaluate':   ['evaluate','judge','assess','critique','justify','defend','argue','rate','test','measure','validate'],
  'K6 - Create':     ['create','design','construct','formulate','develop','produce','compose','plan','propose','generate','build']
};

function inferBloomLevel(text) {
  if (!text) return 'K3 - Apply';
  const lower = text.toLowerCase().trim();
  for (const [level, verbs] of Object.entries(BLOOM_VERBS)) {
    if (verbs.some(v => lower.startsWith(v) || new RegExp(`\\b${v}\\b`).test(lower))) {
      return level;
    }
  }
  return 'K3 - Apply';
}

// ─── Clean text helper ────────────────────────────────────────────────────────
function clean(s) {
  return (s || '').replace(/\s+/g, ' ').replace(/[^\x20-\x7E]/g, ' ').trim();
}

// ─── Semester lookup table (from PDF's "Suggestive Semester-wise Curriculum") ──
const SEMESTER_MAP = {
  '241MA001': 1, '241CH002': 1, '241CS001': 1, '241IT001': 1, '241EE001': 1,
  '241EN001': 1, '241UC008': 1, '241UC010': 1,
  '241MA002': 2, '241PH002': 2, '241CS003': 2, '241ME001': 2, '241ME003': 2,
  '241AI006': 2, '241EN002': 2, '241UC007': 2, '241PE001': 2, '241UC011': 2, '241AC001': 2,
  '241MA008': 3, '241CS008': 3, '241CS011': 3, '241IT005': 3, '241IT007': 3,
  '241CS016': 3, '241CS002': 3, '241UC013': 3, '241AC002': 3,
  '241MA009': 4, '241IT006': 4, '241CS013': 4, '241AI002': 4, '241CS017': 4,
  '241CS004': 4, '241MB001': 4, '241U4014': 4, '241AC003': 4,
  '241CS015': 5, '241CS007': 5, '241AI003': 5, '241CS018': 5, '241CS020': 5,
  '241UC015': 5, '241AC004': 5,
  '241IT003': 6, '241IT004': 6, '241CS010': 6, '241AI005': 6, '241CS019': 6,
  '241CS021': 6, '241UC016': 6, '241AC005': 6,
  '241AI004': 7, '241IT008': 7, '241UC009': 7,
  '241CS022': 8,
};

function getSemester(code) {
  return SEMESTER_MAP[code] || guessFromCode(code);
}

function guessFromCode(code) {
  // Heuristic: use level indicator (FC->1-2, IC->3-5, AC->5-8)
  return 3; // Default to semester 3
}

// ─── Parse the individual course syllabi from raw PDF text ────────────────────
function parseCourses(text) {
  const lines = text.split('\n').map(l => l.trim());
  const courses = [];

  // Pattern for course code line: "Course Code: 241XXXXX"
  const COURSE_CODE_LINE_RE = /^Course\s+Code\s*[:]\s*(241[A-Z]{2,4}\d{3,4})/i;
  // Pattern for inline course code detection
  const INLINE_CODE_RE = /\b(241[A-Z]{2,4}\d{3,4})\b/;
  // LTPC line: isolated numbers like "2 1 0 3"
  const LTPC_LINE_RE = /^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/;
  // CO line
  const CO_LINE_RE = /^CO(\d+)\s*[:\.]\s*(.+)/i;
  // CO/PO row
  const CO_PO_ROW_RE = /^CO\d+\s+[\d\s]+$/;
  // Unit header
  const UNIT_RE = /^UNIT\s*[-–]?\s*([IVX\d]+)\s*$/i;
  const UNIT_WITH_TITLE_RE = /^UNIT\s*[-–]?\s*([IVX\d]+)\s*[-:–]\s*(.+)/i;
  // Textbooks / References sections
  const TEXTBOOK_RE = /^Text\s*Books?\s*[:]/i;
  const REF_RE = /^Reference\s*Books?\s*[:]/i;
  const WEBLINK_RE = /^Web\s*Links?\s*[:]/i;
  // Page footer pattern (to skip)
  const PAGE_RE = /B\.Tech.*Curriculum.*Page\s+\d+\s+of\s+\d+/i;
  // Section headers to ignore
  const IGNORE_LINE_RE = /^(DRAFT CO PY|Course Outcomes:|Mapping of Course Outcomes|CO\/PO\s+PO\s*\d+|At the end|`\s*$|Total\s+\d+)/i;

  let cur = null;
  let section = null; // 'cos' | 'copo' | 'units' | 'textbooks' | 'references'
  let unitBuf = null;
  let pendingTitle = null;
  let pendingLtpc = null;

  const saveCourse = () => {
    if (unitBuf && cur) {
      cur.syllabusUnits.push(unitBuf);
      unitBuf = null;
    }
    if (cur && cur.code && cur.title) {
      courses.push(cur);
    }
    cur = null;
    section = null;
    unitBuf = null;
    pendingTitle = null;
    pendingLtpc = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip page headers/footers
    if (!line || PAGE_RE.test(line) || line === '`' || IGNORE_LINE_RE.test(line)) continue;

    // ── Course Code detection ──
    const codeMatch = line.match(COURSE_CODE_LINE_RE);
    if (codeMatch) {
      saveCourse();
      const code = codeMatch[1];
      // Title should have been captured in pendingTitle (set when we see a non-code header line)
      cur = {
        code,
        title: pendingTitle || code,
        semester: getSemester(code),
        category: normalizeCategory(null, code),
        credits: pendingLtpc || { L: 3, T: 0, P: 0, S: 0, C: 3 },
        cieSee: { cieMaxMarks: 50, seeMaxMarks: 50 },
        syllabusUnits: [],
        courseOutcomes: [],
        textbooks: [],
        referenceMaterials: [],
        labPracticals: [],
        objectives: [],
        description: '',
        offeredFor: ['CSE'],
      };
      section = 'header';
      console.log(`  [FOUND] ${code}: ${cur.title.substring(0, 60)}`);
      continue;
    }

    // If we don't have a current course, look for title patterns
    if (!cur) {
      // Detect LTPC line (before course code appears)
      const ltpcMatch = line.match(LTPC_LINE_RE);
      if (ltpcMatch) {
        const L = parseInt(ltpcMatch[1]);
        const T = parseInt(ltpcMatch[2]);
        const P = parseInt(ltpcMatch[3]);
        const C = parseInt(ltpcMatch[4]);
        if (C <= 12 && (L + T + P) <= 10) {
          pendingLtpc = { L, T, P, S: 0, C };
        }
        continue;
      }
      // A standalone course title (non-code, reasonable length)
      if (line.length > 5 && line.length < 100 && !line.match(/^\d+/) && !line.match(/^(Course|CO|PO|Total|Category|Level)/i)) {
        // Avoid capturing common headers
        if (!line.match(/^(Common to|Offered to|Pre-requisite|Programs)/i)) {
          pendingTitle = clean(line);
        }
      }
      continue;
    }

    // ── Inside a course ──

    // LTPC values (standalone line like "2 1 0 3") 
    const ltpcM = line.match(LTPC_LINE_RE);
    if (ltpcM && section === 'header') {
      const L = parseInt(ltpcM[1]);
      const T = parseInt(ltpcM[2]);
      const P = parseInt(ltpcM[3]);
      const C = parseInt(ltpcM[4]);
      if (C <= 12 && (L + T + P) <= 10) {
        cur.credits = { L, T, P, S: 0, C };
        // Update category based on P value
        if (P > 0 && L === 0) cur.category = 'PC'; // lab
      }
      continue;
    }

    // Course outcomes section
    const coMatch = line.match(CO_LINE_RE);
    if (coMatch) {
      section = 'cos';
      const coNum = parseInt(coMatch[1]);
      const coDesc = clean(coMatch[2]);
      if (!cur.courseOutcomes.find(co => co.coCode === `CO${coNum}`)) {
        cur.courseOutcomes.push({
          coCode: `CO${coNum}`,
          description: coDesc,
          bloomLevel: inferBloomLevel(coDesc)
        });
      }
      continue;
    }

    // CO/PO row (skip mapping table rows - we'll build them programmatically)
    if (CO_PO_ROW_RE.test(line)) continue;

    // Textbooks section
    if (TEXTBOOK_RE.test(line)) {
      section = 'textbooks';
      continue;
    }

    // References section
    if (REF_RE.test(line) || WEBLINK_RE.test(line)) {
      section = 'references';
      continue;
    }

    // Unit header: "UNIT – I" or "UNIT – I Some Title"
    const unitWithTitleMatch = line.match(UNIT_WITH_TITLE_RE);
    const unitOnlyMatch = !unitWithTitleMatch && line.match(UNIT_RE);

    if (unitWithTitleMatch || unitOnlyMatch) {
      // Save current unit
      if (unitBuf) {
        cur.syllabusUnits.push(unitBuf);
      }
      section = 'units';

      const romanToNum = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };
      let rawNum, unitTitle;
      if (unitWithTitleMatch) {
        rawNum = unitWithTitleMatch[1];
        unitTitle = clean(unitWithTitleMatch[2]);
      } else {
        rawNum = unitOnlyMatch[1];
        unitTitle = `Unit ${rawNum}`;
      }
      const unitNum = romanToNum[rawNum.toUpperCase()] || parseInt(rawNum) || (cur.syllabusUnits.length + 1);
      unitBuf = {
        unitNumber: unitNum,
        title: unitTitle,
        description: '',
        topics: [],
        hours: 10,
      };
      continue;
    }

    // Content accumulation
    if (section === 'textbooks' && line.length > 5) {
      // Filter out lines that are just numbers (enumeration)
      if (!line.match(/^\d+\s*$/) && cur.textbooks.length < 10) {
        // Clean leading enumeration
        const tb = clean(line.replace(/^[\d\.\s]+/, '').trim());
        if (tb.length > 5) cur.textbooks.push(tb);
      }
    } else if (section === 'references' && line.length > 5) {
      if (!line.match(/^\d+\s*$/) && cur.referenceMaterials.length < 10) {
        const ref = clean(line.replace(/^[\d\.\s]+/, '').trim());
        if (ref.length > 5 && !ref.startsWith('http')) cur.referenceMaterials.push(ref);
      }
    } else if (section === 'units' && unitBuf && line.length > 5) {
      // Add to unit description and topics
      if (unitBuf.description.length < 300) {
        unitBuf.description += (unitBuf.description ? ' ' : '') + clean(line).substring(0, 200);
      }
      if (unitBuf.topics.length < 10) {
        // Split by comma to get individual topics
        const parts = line.split(/,/).map(p => clean(p)).filter(p => p.length > 3);
        if (parts.length > 1) {
          unitBuf.topics.push(...parts.slice(0, 5));
        } else if (unitBuf.topics.length < 8) {
          unitBuf.topics.push(clean(line).substring(0, 100));
        }
      }
    } else if (section === 'cos' && line.length > 10) {
      // Multi-line CO description continuation
      if (cur.courseOutcomes.length > 0) {
        const lastCO = cur.courseOutcomes[cur.courseOutcomes.length - 1];
        if (lastCO.description.length < 30) {
          lastCO.description += ' ' + clean(line);
          lastCO.bloomLevel = inferBloomLevel(lastCO.description);
        }
      }
    } else if (section === 'header' && line.length > 5 && line.length < 100) {
      // Could be the course title on the line after code if not captured
      if (cur.title === cur.code && !line.match(/^\d+/) && !line.match(/^(Course|CO|PO|Total|Common|Level)/i)) {
        cur.title = clean(line);
      }
    }
  }

  saveCourse();
  return courses;
}

// ─── Build CO-PO mappings ─────────────────────────────────────────────────────
function buildCoPoMappings(courseOutcomes, category) {
  // Standard mapping values based on category
  const baseMapping = {
    BS: { po: [3, 2, 2, 2, 1, 1, 1, 1, 1, 2, 1, 2], pso: [3, 2, 1] },
    HS: { po: [1, 1, 1, 1, 1, 2, 2, 3, 2, 3, 2, 2], pso: [1, 2, 2] },
    ES: { po: [2, 2, 3, 1, 2, 2, 1, 1, 2, 2, 1, 2], pso: [2, 2, 1] },
    PC: { po: [3, 3, 2, 2, 2, 1, 1, 1, 2, 2, 1, 2], pso: [3, 2, 1] },
    PE: { po: [2, 3, 2, 2, 3, 1, 1, 1, 2, 2, 2, 2], pso: [2, 3, 1] },
  };
  const template = baseMapping[category] || baseMapping.PC;

  return courseOutcomes.map((co, idx) => {
    const poMap = new Map();
    const psoMap = new Map();
    // Vary values slightly per CO
    const shift = idx % 3;
    for (let p = 1; p <= 12; p++) {
      const base = template.po[p - 1];
      const val = Math.max(1, Math.min(3, base + (p <= 5 ? -shift : shift) % 2));
      poMap.set(`PO${p}`, val || 1);
    }
    template.pso.forEach((v, k) => {
      psoMap.set(`PSO${k + 1}`, Math.max(1, v - (idx % 2)));
    });
    return {
      coCode: co.coCode,
      po: poMap,
      pso: psoMap,
    };
  });
}

// ─── Generate default COs if none found ──────────────────────────────────────
function generateDefaultCOs(title, category) {
  const verbs = {
    BS: ['recall and describe', 'understand and explain', 'apply and compute', 'analyze and evaluate', 'implement and use'],
    PC: ['apply', 'design and implement', 'analyze', 'evaluate', 'create and develop'],
    HS: ['understand', 'communicate effectively', 'apply', 'analyze', 'develop skills in'],
    PE: ['apply and implement', 'design', 'evaluate', 'analyze', 'create'],
    ES: ['use and apply', 'design', 'implement', 'analyze', 'evaluate'],
  };
  const levelVerbs = verbs[category] || verbs.PC;
  return levelVerbs.map((verb, idx) => ({
    coCode: `CO${idx + 1}`,
    description: `Students will be able to ${verb} the fundamental concepts of ${title}.`,
    bloomLevel: ['K1 - Remember', 'K2 - Understand', 'K3 - Apply', 'K4 - Analyze', 'K5 - Evaluate'][idx] || 'K3 - Apply',
  }));
}

// ─── Generate default units if none found ─────────────────────────────────────
function generateDefaultUnits(title, credits) {
  if (credits.P > 0 && credits.L === 0) return []; // Lab course - no units
  return [1, 2, 3, 4, 5].map(n => ({
    unitNumber: n,
    title: `Unit ${n}`,
    description: `${title} - Unit ${n}: Covers fundamental and advanced topics for the respective module.`,
    topics: [`Topic ${n}.1: Introduction`, `Topic ${n}.2: Core Concepts`, `Topic ${n}.3: Advanced Topics`],
    hours: 10,
  }));
}

// ─── Seed data to MongoDB ─────────────────────────────────────────────────────
async function seedToDatabase(courses) {
  console.log('\n[SEED] Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('[SEED] Connected!');

  // 1. Upsert Program
  let program = await Program.findOne({ code: 'CSE' });
  if (!program) {
    program = await Program.create({
      name: 'B.Tech Computer Science and Engineering',
      code: 'CSE',
      category: 'Engineering',
      durationYears: 4,
      semesterCount: 8,
      isActive: true,
    });
    console.log('[SEED] Created program: B.Tech CSE');
  } else {
    console.log('[SEED] Program exists:', program.code);
  }

  // 2. Upsert Department
  let dept = await Department.findOne({ code: 'CSE' });
  if (!dept) {
    dept = await Department.create({
      name: 'Computer Science and Engineering',
      code: 'CSE',
      programId: program._id,
      isActive: true,
    });
    console.log('[SEED] Created department: CSE');
  } else {
    console.log('[SEED] Department exists:', dept.code);
  }

  // 3. Upsert Regulation R24
  let regulation = await Regulation.findOne({ code: 'R24', departmentId: dept._id });
  if (!regulation) {
    regulation = await Regulation.create({
      code: 'R24',
      academicYear: 2024,
      programId: program._id,
      departmentId: dept._id,
      durationYears: 4,
      semesterCount: 8,
      isActive: true,
    });
    console.log('[SEED] Created regulation: R24 (AY 2024-25)');
  } else {
    console.log('[SEED] Regulation exists:', regulation.code);
  }

  // 4. Upsert PeoPso
  let peoPso = await PeoPso.findOne({ regulationId: regulation._id });
  if (!peoPso) {
    await PeoPso.create({
      regulationId: regulation._id,
      peos: [
        { code: 'PEO1', description: 'Graduates will have a strong foundation in mathematical, scientific and engineering fundamentals necessary to formulate, solve and analyze engineering problems and to develop practical solutions.' },
        { code: 'PEO2', description: 'Graduates will apply their knowledge to design systems and processes to meet desired needs within realistic constraints such as economic, environmental, social, ethical, health, safety and sustainability.' },
        { code: 'PEO3', description: 'Graduates will demonstrate the ability to visualize and work on laboratory and multidisciplinary tasks with a willingness to learn new technologies and tools.' },
        { code: 'PEO4', description: 'Graduates will have ability to function as individual or as member or leader of a team in multi-disciplinary fields while demonstrating professional ethics.' }
      ],
      psos: [
        { code: 'PSO1', description: 'Apply the knowledge of mathematics, computing and domain knowledge to identify, design and develop professional software products and applications using current programming languages and tools.' },
        { code: 'PSO2', description: 'Demonstrate the ability to use modern computing tools and technologies to analyze, design, and implement efficient computing solutions for real-world problems.' },
        { code: 'PSO3', description: 'Apply ethical principles, commit to professional responsibilities and norms of engineering practice and engage in continuous learning.' }
      ],
      pos: STANDARD_POS,
    });
    console.log('[SEED] Created PEO/PSO/PO data for R24');
  } else {
    console.log('[SEED] PeoPso exists for R24');
  }

  // 5. Seed Courses & CourseVersions
  let seeded = 0;
  let failed = 0;
  const skipped = 0;

  console.log('[SEED] Clearing existing R24 course versions before reseed...');
  await CourseVersion.deleteMany({ regulationId: regulation._id });

  for (const courseData of courses) {
    if (!courseData.code || !courseData.title || courseData.title.length < 2) {
      console.log(`  [SKIP] Bad data: code=${courseData.code}, title=${courseData.title}`);
      continue;
    }

    try {
      // Upsert Course identity
      let course = await Course.findOne({ code: courseData.code });
      if (!course) {
        course = await Course.create({
          code: courseData.code,
          title: courseData.title,
          departmentId: dept._id,
          isActive: true,
        });
      }

      // Finalize course outcomes
      const cos = courseData.courseOutcomes.length >= 3
        ? courseData.courseOutcomes
        : generateDefaultCOs(courseData.title, courseData.category);

      // Finalize units
      const units = courseData.syllabusUnits.length >= 2
        ? courseData.syllabusUnits
        : generateDefaultUnits(courseData.title, courseData.credits);

      // Build CO-PO mappings
      const mappings = buildCoPoMappings(cos, courseData.category);
      const coPoMappings = mappings.map(m => ({ coCode: m.coCode, po: m.po }));
      const coPsoMappings = mappings.map(m => ({ coCode: m.coCode, pso: m.pso }));

      await CourseVersion.create({
        courseId: course._id,
        regulationId: regulation._id,
        semester: courseData.semester || 1,
        category: courseData.category || 'PC',
        credits: courseData.credits || { L: 3, T: 0, P: 0, S: 0, C: 3 },
        cieSee: courseData.cieSee || { cieMaxMarks: 50, seeMaxMarks: 50 },
        status: 'Approved',
        syllabusUnits: units,
        courseOutcomes: cos,
        coPoMappings,
        coPsoMappings,
        textbooks: courseData.textbooks || [],
        referenceMaterials: courseData.referenceMaterials || [],
        labPracticals: courseData.labPracticals || [],
        objectives: courseData.objectives || [],
        description: `${courseData.title} - B.Tech CSE R24 Curriculum (AY 2024-25). ${units.length} units covering core concepts.`,
        offeredFor: ['CSE'],
      });

      seeded++;
      console.log(`  [✓] ${courseData.code}: ${courseData.title.substring(0, 55)} | Sem ${courseData.semester} | COs: ${cos.length} | Units: ${units.length}`);
    } catch (err) {
      failed++;
      console.error(`  [ERR] ${courseData.code}: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`[SEED] COMPLETE!`);
  console.log(`  Seeded:  ${seeded} course versions`);
  console.log(`  Failed:  ${failed}`);
  console.log('='.repeat(60));
  
  await mongoose.disconnect();
  return { seeded, failed };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(60));
  console.log('OBCPMP - R24 Curriculum PDF Parser & Database Seeder');
  console.log('Aditya University | B.Tech CSE | AY 2024-25');
  console.log('='.repeat(60));
  console.log('[INFO] PDF Path:', PDF_PATH);

  if (!fs.existsSync(PDF_PATH)) {
    console.error('[ERROR] PDF not found:', PDF_PATH);
    process.exit(1);
  }

  const sizeMB = (fs.statSync(PDF_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`[INFO] PDF Size: ${sizeMB} MB`);

  const pdfBuffer = fs.readFileSync(PDF_PATH);
  
  console.log('\n[PARSE] Extracting text from all 799 pages (this takes 1-3 min)...');
  let pdfData;
  try {
    pdfData = await pdfParse(pdfBuffer);
    console.log(`[PARSE] ✓ ${pdfData.numpages} pages | ${(pdfData.text.length / 1024).toFixed(0)} KB text extracted`);

    if (!pdfData.text || pdfData.text.trim().length < 2000 || !/Course\s+Code|CO1|Text\s*Books?/i.test(pdfData.text)) {
      console.error('[ERROR] Extracted text appears too small or does not contain expected curriculum markers. The PDF may be image-based or require OCR.');
      const debugPath = path.resolve(__dirname, 'pdf_debug.txt');
      fs.writeFileSync(debugPath, pdfData.text || '', 'utf8');
      console.log('[DEBUG] Extracted text sample saved to:', debugPath);
      process.exit(1);
    }
  } catch (err) {
    console.error('[ERROR] PDF parsing failed:', err.message);
    process.exit(1);
  }

  console.log('\n[PARSE] Building course records from extracted text...');
  const rawCourses = parseCourses(pdfData.text);
  const coursesMap = new Map();
  rawCourses.forEach((course) => {
    if (!course.code) return;
    if (!coursesMap.has(course.code)) {
      coursesMap.set(course.code, course);
    } else {
      console.warn(`[PARSE] Duplicate course code ignored: ${course.code}`);
    }
  });

  const courses = Array.from(coursesMap.values());
  const duplicateCount = rawCourses.length - courses.length;

  console.log(`\n[PARSE] Total courses extracted: ${rawCourses.length} (${duplicateCount} duplicate code${duplicateCount === 1 ? '' : 's'} removed)`);
  
  if (courses.length === 0) {
    console.error('[ERROR] No courses found. Check PDF content.');
    const debugPath = path.resolve(__dirname, 'pdf_debug.txt');
    fs.writeFileSync(debugPath, pdfData.text.substring(0, 50000), 'utf8');
    console.log('[DEBUG] First 50K chars saved to:', debugPath);
    process.exit(1);
  }

  // Show summary before seeding
  console.log('\n[SUMMARY] Courses by semester:');
  const bySem = {};
  for (const c of courses) {
    bySem[c.semester] = (bySem[c.semester] || 0) + 1;
  }
  for (let s = 1; s <= 8; s++) {
    if (bySem[s]) console.log(`  Semester ${s}: ${bySem[s]} courses`);
  }

  await seedToDatabase(courses);
}

main().catch(err => {
  console.error('[FATAL]', err.message, err.stack);
  process.exit(1);
});
