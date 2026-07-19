/**
 * curriculumDocxService.js
 * Generates a fully structured .docx curriculum book from live DB data.
 * Matches the PDF format exactly page-for-page.
 */

import fs from 'fs';
import path from 'path';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  BorderStyle, WidthType, AlignmentType, HeadingLevel, ImageRun,
  PageBreak, SectionType, convertInchesToTwip, convertMillimetersToTwip,
  Header, Footer, PageNumber, TableLayoutType, VerticalMergeType,
} from 'docx';
import Course from '../models/Course.js';
import CourseVersion from '../models/CourseVersion.js';
import Regulation from '../models/Regulation.js';
import Program from '../models/Program.js';
import MinorStream from '../models/MinorStream.js';
import PrerequisiteLink from '../models/PrerequisiteLink.js';
import CourseCategory from '../models/CourseCategory.js';
import {
  getDynamicCurriculumContext,
  getCourseLevelCode,
  getMappingValue,
  deriveMappingColumns,
  formatCommonTo,
  getUecStream
} from './curriculumDataService.js';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const CELL_BORDER = {
  top:    { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  left:   { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  right:  { style: BorderStyle.SINGLE, size: 6, color: '000000' },
};

const HEADER_SHADE = { fill: 'E5E7EB', type: 'clear' };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const pt = (n) => n * 2; // half-points

const textRun = (text = '', opts = {}) => new TextRun({ text: String(text ?? ''), ...opts });

const boldRun = (text = '', opts = {}) => textRun(text, { bold: true, ...opts });

const cell = (children = [], opts = {}) => new TableCell({
  borders: CELL_BORDER,
  children: Array.isArray(children) ? children : [children],
  ...opts,
});

const headerCell = (text = '', span = 1, opts = {}) => new TableCell({
  borders: CELL_BORDER,
  shading: HEADER_SHADE,
  columnSpan: span,
  children: [new Paragraph({ children: [boldRun(text, { size: pt(9) })], alignment: opts.align || AlignmentType.CENTER })],
  ...opts,
});

const dataCell = (text = '', opts = {}) => new TableCell({
  borders: CELL_BORDER,
  children: [new Paragraph({ children: [textRun(text, { size: pt(9) })], alignment: opts.align || AlignmentType.CENTER })],
  ...opts,
});

const sectionHeading = (text) => new Paragraph({
  children: [boldRun(text, { size: pt(13), color: '111827' })],
  heading: HeadingLevel.HEADING_2,
  alignment: AlignmentType.CENTER,
  spacing: { before: convertMillimetersToTwip(8), after: convertMillimetersToTwip(5) },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '111827' } },
});

const subHeading = (text) => new Paragraph({
  children: [boldRun(text, { size: pt(11) })],
  heading: HeadingLevel.HEADING_3,
  spacing: { before: convertMillimetersToTwip(5), after: convertMillimetersToTwip(3) },
});

const emptyPara = (lines = 1) => Array.from({ length: lines }, () =>
  new Paragraph({ children: [textRun('')], spacing: { after: 0 } })
);

const stripHtml = (html = '') => {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
};

const fmtC = (val) => (val === 0 || !val) ? '-' : String(val);

const getLogoBuffer = () => {
  const candidates = [
    path.resolve(process.cwd(), '..', 'frontend', 'src', 'assets', 'aditya-logo.png'),
    path.resolve(process.cwd(), 'frontend', 'src', 'assets', 'aditya-logo.png'),
    path.resolve('frontend', 'src', 'assets', 'aditya-logo.png'),
    path.resolve('..', 'frontend', 'src', 'assets', 'aditya-logo.png'),
  ];
  const found = candidates.find(c => fs.existsSync(c));
  return found ? fs.readFileSync(found) : null;
};

// ─── FLOWCHART TABLES RECREATION ─────────────────────────────────────────────

const buildFlowchartTable = (title, levelsData) => {
  const colWidths = [15, 85];
  
  return [
    new Paragraph({
      children: [boldRun(title, { size: pt(11), color: '1D4ED8' })],
      spacing: { before: convertMillimetersToTwip(6), after: convertMillimetersToTwip(4) },
      alignment: AlignmentType.CENTER,
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: levelsData.map(level => {
        const courseCells = level.courses.map(c => new TableCell({
          shading: { fill: level.courseBg || 'FFE0B2', type: 'clear' },
          borders: CELL_BORDER,
          children: [new Paragraph({ children: [boldRun(c, { size: pt(8.5) })], alignment: AlignmentType.CENTER })],
        }));
        
        const innerTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: courseCells.length ? courseCells : [
                new TableCell({
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [new Paragraph({ children: [textRun('—', { size: pt(9.5) })], alignment: AlignmentType.CENTER })]
                })
              ]
            })
          ]
        });

        return new TableRow({
          children: [
            new TableCell({
              width: { size: colWidths[0], type: WidthType.PERCENTAGE },
              shading: { fill: level.labelBg || 'E2C027', type: 'clear' },
              borders: CELL_BORDER,
              children: [
                new Paragraph({
                  children: [boldRun(level.key, { size: pt(12), color: '000000' })],
                  alignment: AlignmentType.CENTER,
                })
              ]
            }),
            new TableCell({
              width: { size: colWidths[1], type: WidthType.PERCENTAGE },
              shading: { fill: level.rowBg || 'FFF9C4', type: 'clear' },
              borders: CELL_BORDER,
              children: [innerTable]
            })
          ]
        });
      })
    }),
    ...emptyPara(1)
  ];
};

const buildPrereqFlowchart = (courseVersions) => {
  const getLevelCourses = (lvlKey) => {
    return courseVersions.filter(v => {
      if (v.category && v.category.toLowerCase().includes('msc')) return false;
      const lvl = getCourseLevelCode(v);
      return lvl === lvlKey;
    }).map(v => v.courseId?.keyword || v.courseId?.code || '');
  };

  const levelsData = [
    { key: 'FC', labelBg: 'D4EDDA', rowBg: 'F1F9F3', courseBg: 'C3E6CB', courses: getLevelCourses('FC') },
    { key: 'IC', labelBg: 'F8D7DA', rowBg: 'FDF3F4', courseBg: 'F5C6CB', courses: getLevelCourses('IC') },
    { key: 'AC', labelBg: 'FFF3CD', rowBg: 'FFFBF0', courseBg: 'FFEEBA', courses: getLevelCourses('AC') },
  ];

  return buildFlowchartTable('Pre-requisite Flow Chart', levelsData);
};

const buildMinorStreamFlowchart = (minorStreams, allVersions) => {
  if (!minorStreams.length) return [];
  
  const headers = [
    headerCell('Level', 1, { width: { size: 10, type: WidthType.PERCENTAGE } }),
    ...minorStreams.map(stream => headerCell(stream.keyword || stream.name.split(' ').map(w => w[0]).join(''), 1, {
      width: { size: Math.floor(90 / minorStreams.length), type: WidthType.PERCENTAGE }
    }))
  ];

  const makeLevelRow = (levelKey, labelBg, rowBg, courseBg) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: labelBg, type: 'clear' },
          borders: CELL_BORDER,
          children: [new Paragraph({ children: [boldRun(levelKey, { size: pt(11) })], alignment: AlignmentType.CENTER })]
        }),
        ...minorStreams.map(stream => {
          const streamCourses = stream.courses || [];
          const levelCourses = streamCourses.filter(c => {
            const v = allVersions.find(ver => String(ver.courseId === c._id || ver.courseId?._id === c._id));
            const lvl = getCourseLevelCode(v || { courseLevel: c.level });
            return lvl === levelKey;
          });

          return new TableCell({
            shading: { fill: rowBg, type: 'clear' },
            borders: CELL_BORDER,
            children: levelCourses.length ? [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: levelCourses.map(c => new TableCell({
                      shading: { fill: courseBg, type: 'clear' },
                      borders: CELL_BORDER,
                      children: [new Paragraph({ children: [boldRun(c.keyword || c.code, { size: pt(8) })], alignment: AlignmentType.CENTER })]
                    }))
                  })
                ]
              })
            ] : [new Paragraph({ children: [textRun('—', { size: pt(9) })], alignment: AlignmentType.CENTER })]
          });
        })
      ]
    });
  };

  return [
    new Paragraph({
      children: [boldRun('Minor Stream Pre-requisite Flow Chart', { size: pt(11), color: '1D4ED8' })],
      spacing: { before: convertMillimetersToTwip(6), after: convertMillimetersToTwip(4) },
      alignment: AlignmentType.CENTER,
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ tableHeader: true, children: headers }),
        makeLevelRow('FC', 'E2C027', 'FDECA6', 'FFCC80'),
        makeLevelRow('IC', 'D4DF32', 'F4A5A5', 'FFCDD2'),
        makeLevelRow('AC', 'E2C027', 'E6A8D7', 'F8BBD0'),
      ]
    }),
    ...emptyPara(1)
  ];
};

const buildMinorDegreeFlowchart = (publishedMinorDegrees, allVersions) => {
  const flatMinors = Object.values(publishedMinorDegrees).flat();
  if (!flatMinors.length) return [];

  const headers = [
    headerCell('Level', 1, { width: { size: 10, type: WidthType.PERCENTAGE } }),
    ...flatMinors.map(minor => {
      const shortName = minor.departmentName 
        ? minor.departmentName.split(' ').map(w => w[0]).join('') 
        : minor.minorName.split(' ').map(w => w[0]).join('');
      return headerCell(shortName, 1, {
        width: { size: Math.floor(90 / flatMinors.length), type: WidthType.PERCENTAGE }
      });
    })
  ];

  const makeLevelRow = (levelKey, labelBg, rowBg, courseBg) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: labelBg, type: 'clear' },
          borders: CELL_BORDER,
          children: [new Paragraph({ children: [boldRun(levelKey, { size: pt(11) })], alignment: AlignmentType.CENTER })]
        }),
        ...flatMinors.map(minor => {
          const courses = minor.courses || [];
          const levelCourses = courses.filter(c => {
            const v = allVersions.find(ver => ver.courseId?.code === c.courseCode);
            const lvl = getCourseLevelCode(v || { courseLevel: c.level });
            return lvl === levelKey;
          });

          return new TableCell({
            shading: { fill: rowBg, type: 'clear' },
            borders: CELL_BORDER,
            children: levelCourses.length ? [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: levelCourses.map(c => new TableCell({
                      shading: { fill: courseBg, type: 'clear' },
                      borders: CELL_BORDER,
                      children: [new Paragraph({ children: [boldRun(c.courseCode, { size: pt(8) })], alignment: AlignmentType.CENTER })]
                    }))
                  })
                ]
              })
            ] : [new Paragraph({ children: [textRun('—', { size: pt(9) })], alignment: AlignmentType.CENTER })]
          });
        })
      ]
    });
  };

  return [
    new Paragraph({
      children: [boldRun('Minor Degree Pre-requisite Flow Chart', { size: pt(11), color: '1D4ED8' })],
      spacing: { before: convertMillimetersToTwip(6), after: convertMillimetersToTwip(4) },
      alignment: AlignmentType.CENTER,
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({ tableHeader: true, children: headers }),
        makeLevelRow('FC', '4A7EBB', 'EAEFF7', '7AB5E1'),
        makeLevelRow('IC', '95B3D7', 'B8CCE4', '4A7EBB'),
        makeLevelRow('AC', 'E36C09', 'FEF2CB', 'F79646'),
      ]
    }),
    ...emptyPara(1)
  ];
};

// ─── COVER PAGE DEPT BOX BUILDER ─────────────────────────────────────────────

const buildDeptTitleBox = (deptName) => {
  return new Table({
    width: { size: 68, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 12, color: '000000' },
              left:   { style: BorderStyle.SINGLE, size: 12, color: '000000' },
              bottom: { style: BorderStyle.SINGLE, size: 24, color: '000000' },
              right:  { style: BorderStyle.SINGLE, size: 24, color: '000000' },
            },
            margins: {
              top:    convertMillimetersToTwip(6),
              bottom: convertMillimetersToTwip(6),
              left:   convertMillimetersToTwip(8),
              right:  convertMillimetersToTwip(8),
            },
            children: [
              new Paragraph({
                children: [boldRun(deptName.toUpperCase(), { size: pt(16), color: '000000' })],
                alignment: AlignmentType.CENTER,
              })
            ]
          })
        ]
      })
    ]
  });
};

// ─── TABLE BUILDERS ───────────────────────────────────────────────────────────

/** Credit Division Table */
const buildCreditDivisionTable = (dbCategories, categoryTotals, programTotalCredits) => {
  const grandTotal = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

  const getRowCredits = (code) => {
    if (code === 'MSC/UEC') return (categoryTotals['MSC/UEC'] || 0) + (categoryTotals['MSC'] || 0) + (categoryTotals['UEC'] || 0);
    return categoryTotals[code] || 0;
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('S.No',  1, { width: { size: 10, type: WidthType.PERCENTAGE } }),
          headerCell('Broad Category of Course', 1, { width: { size: 55, type: WidthType.PERCENTAGE }, align: AlignmentType.LEFT }),
          headerCell('UGC',     1, { width: { size: 20, type: WidthType.PERCENTAGE } }),
          headerCell('Credits', 1, { width: { size: 15, type: WidthType.PERCENTAGE } }),
        ],
      }),
      ...dbCategories.map((cat, idx) => new TableRow({
        children: [
          dataCell(String(idx + 1)),
          dataCell(cat.name || cat.code, { align: AlignmentType.LEFT }),
          dataCell(cat.ugc || '-'),
          dataCell(String(getRowCredits(cat.code) || '')),
        ],
      })),
      // Total row
      new TableRow({
        children: [
          new TableCell({
            borders: CELL_BORDER,
            columnSpan: 2,
            children: [new Paragraph({ children: [boldRun('Total Credits to be earned for B. Tech Degree', { size: pt(9) })], alignment: AlignmentType.LEFT })],
          }),
          dataCell(String(programTotalCredits)),
          dataCell(String(grandTotal || programTotalCredits)),
        ],
      }),
    ],
  });
};

/** Level-wise Structure Table */
const buildLevelTable = (levelLabel, levelRows) => {
  const colWidths = [45, 15, 8, 8, 8, 8, 8]; // Course Name, Category, L, T, P, S, C
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        // Merged Header Row 1: Level Title Box inside the table
        new TableRow({
          tableHeader: true,
          children: [
            headerCell(levelLabel, 7, { align: AlignmentType.CENTER })
          ]
        }),
        // Header Row 2
        new TableRow({
          tableHeader: true,
          children: [
            headerCell('Course Name', 1, { width: { size: colWidths[0], type: WidthType.PERCENTAGE }, align: AlignmentType.LEFT }),
            headerCell('Category',    1, { width: { size: colWidths[1], type: WidthType.PERCENTAGE } }),
            headerCell('L',           1, { width: { size: colWidths[2], type: WidthType.PERCENTAGE } }),
            headerCell('T',           1, { width: { size: colWidths[3], type: WidthType.PERCENTAGE } }),
            headerCell('P',           1, { width: { size: colWidths[4], type: WidthType.PERCENTAGE } }),
            headerCell('S',           1, { width: { size: colWidths[5], type: WidthType.PERCENTAGE } }),
            headerCell('C',           1, { width: { size: colWidths[6], type: WidthType.PERCENTAGE } }),
          ],
        }),
        ...levelRows.map(v => new TableRow({
          children: [
            dataCell(v.courseId?.title || '-', { align: AlignmentType.LEFT }),
            dataCell(v.category || '-'),
            dataCell(fmtC(v.credits?.L)),
            dataCell(fmtC(v.credits?.T)),
            dataCell(fmtC(v.credits?.P)),
            dataCell(fmtC(v.credits?.S)),
            dataCell(fmtC(v.credits?.C)),
          ],
        })),
      ],
    }),
    ...emptyPara(1),
  ];
};

/** Category-wise Course Listing Table */
const buildCategoryTable = (title, rows) => {
  const totals = rows.reduce((acc, v) => {
    acc.L += v.credits?.L || 0; acc.T += v.credits?.T || 0;
    acc.P += v.credits?.P || 0; acc.S += v.credits?.S || 0; acc.C += v.credits?.C || 0;
    return acc;
  }, { L: 0, T: 0, P: 0, S: 0, C: 0 });

  const colWidths = [10, 25, 8, 5, 5, 5, 5, 5, 6, 6, 6, 14]; // 12 columns
  return [
    subHeading(title),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell('Course Code', 1, { width: { size: colWidths[0], type: WidthType.PERCENTAGE } }),
            headerCell('Course Name',  1, { width: { size: colWidths[1], type: WidthType.PERCENTAGE }, align: AlignmentType.LEFT }),
            headerCell('Level', 1, { width: { size: colWidths[2], type: WidthType.PERCENTAGE } }),
            headerCell('L',     1, { width: { size: colWidths[3], type: WidthType.PERCENTAGE } }),
            headerCell('T',     1, { width: { size: colWidths[4], type: WidthType.PERCENTAGE } }),
            headerCell('P',     1, { width: { size: colWidths[5], type: WidthType.PERCENTAGE } }),
            headerCell('S',     1, { width: { size: colWidths[6], type: WidthType.PERCENTAGE } }),
            headerCell('C',     1, { width: { size: colWidths[7], type: WidthType.PERCENTAGE } }),
            headerCell('CIE',   1, { width: { size: colWidths[8], type: WidthType.PERCENTAGE } }),
            headerCell('SEE',   1, { width: { size: colWidths[9], type: WidthType.PERCENTAGE } }),
            headerCell('Total', 1, { width: { size: colWidths[10], type: WidthType.PERCENTAGE } }),
            headerCell('Pre-requisite', 1, { width: { size: colWidths[11], type: WidthType.PERCENTAGE } }),
          ],
        }),
        ...rows.map(v => {
          const cie = v.cieSee?.cieMaxMarks || 50;
          const see = v.cieSee?.seeMaxMarks || 50;
          const prereq = v.prerequisites?.[0] || '-';
          return new TableRow({
            children: [
              dataCell(v.courseId?.code || '-'),
              dataCell(v.courseId?.title || '-', { align: AlignmentType.LEFT }),
              dataCell(getCourseLevelCode(v)),
              dataCell(fmtC(v.credits?.L)),
              dataCell(fmtC(v.credits?.T)),
              dataCell(fmtC(v.credits?.P)),
              dataCell(fmtC(v.credits?.S)),
              dataCell(fmtC(v.credits?.C)),
              dataCell(String(cie)),
              dataCell(String(see)),
              dataCell(String(cie + see)),
              dataCell(prereq),
            ],
          });
        }),
        // Totals row
        new TableRow({
          children: [
            new TableCell({ borders: CELL_BORDER, columnSpan: 3, children: [new Paragraph({ children: [boldRun('Total', { size: pt(9) })], alignment: AlignmentType.CENTER })] }),
            dataCell(fmtC(totals.L)),
            dataCell(fmtC(totals.T)),
            dataCell(fmtC(totals.P)),
            dataCell(fmtC(totals.S)),
            dataCell(fmtC(totals.C)),
            new TableCell({ borders: CELL_BORDER, columnSpan: 4, children: [new Paragraph({ children: [textRun('')], alignment: AlignmentType.CENTER })] }),
          ],
        }),
      ],
    }),
    ...emptyPara(1),
  ];
};

/** University Open Elective Course Table */
const buildUecTable = (title, rows) => {
  const totals = rows.reduce((acc, v) => {
    acc.L += v.credits?.L || 0; acc.T += v.credits?.T || 0;
    acc.P += v.credits?.P || 0; acc.S += v.credits?.S || 0; acc.C += v.credits?.C || 0;
    return acc;
  }, { L: 0, T: 0, P: 0, S: 0, C: 0 });

  const colWidths = [10, 22, 6, 4, 4, 4, 4, 4, 5, 5, 5, 14, 13];
  return [
    subHeading(title),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell('Course Code', 1, { width: { size: colWidths[0], type: WidthType.PERCENTAGE } }),
            headerCell('Course Name',  1, { width: { size: colWidths[1], type: WidthType.PERCENTAGE }, align: AlignmentType.LEFT }),
            headerCell('Level', 1, { width: { size: colWidths[2], type: WidthType.PERCENTAGE } }),
            headerCell('L',     1, { width: { size: colWidths[3], type: WidthType.PERCENTAGE } }),
            headerCell('T',     1, { width: { size: colWidths[4], type: WidthType.PERCENTAGE } }),
            headerCell('P',     1, { width: { size: colWidths[5], type: WidthType.PERCENTAGE } }),
            headerCell('S',     1, { width: { size: colWidths[6], type: WidthType.PERCENTAGE } }),
            headerCell('C',     1, { width: { size: colWidths[7], type: WidthType.PERCENTAGE } }),
            headerCell('CIE',   1, { width: { size: colWidths[8], type: WidthType.PERCENTAGE } }),
            headerCell('SEE',   1, { width: { size: colWidths[9], type: WidthType.PERCENTAGE } }),
            headerCell('Total', 1, { width: { size: colWidths[10], type: WidthType.PERCENTAGE } }),
            headerCell('Offered to Programs', 1, { width: { size: colWidths[11], type: WidthType.PERCENTAGE } }),
            headerCell('Pre-requisite', 1, { width: { size: colWidths[12], type: WidthType.PERCENTAGE } }),
          ],
        }),
        ...rows.map(v => {
          const cie = v.cieSee?.cieMaxMarks || 50;
          const see = v.cieSee?.seeMaxMarks || 50;
          const offeredTo = (v.offeredFor || []).join(', ') || '-';
          const prereq = v.prerequisites?.[0] || '-';
          return new TableRow({
            children: [
              dataCell(v.courseId?.code || '-'),
              dataCell(v.courseId?.title || '-', { align: AlignmentType.LEFT }),
              dataCell(getCourseLevelCode(v)),
              dataCell(fmtC(v.credits?.L)),
              dataCell(fmtC(v.credits?.T)),
              dataCell(fmtC(v.credits?.P)),
              dataCell(fmtC(v.credits?.S)),
              dataCell(fmtC(v.credits?.C)),
              dataCell(String(cie)),
              dataCell(String(see)),
              dataCell(String(cie + see)),
              dataCell(offeredTo),
              dataCell(prereq),
            ],
          });
        }),
        // Totals row
        new TableRow({
          children: [
            new TableCell({ borders: CELL_BORDER, columnSpan: 3, children: [new Paragraph({ children: [boldRun('Total', { size: pt(9) })], alignment: AlignmentType.CENTER })] }),
            dataCell(fmtC(totals.L)),
            dataCell(fmtC(totals.T)),
            dataCell(fmtC(totals.P)),
            dataCell(fmtC(totals.S)),
            dataCell(fmtC(totals.C)),
            new TableCell({ borders: CELL_BORDER, columnSpan: 5, children: [new Paragraph({ children: [textRun('')], alignment: AlignmentType.CENTER })] }),
          ],
        }),
      ],
    }),
    ...emptyPara(1),
  ];
};

/** Semester-wise Structure Table */
const buildSemesterTable = (semNum, semCourses) => {
  const totals = semCourses.reduce((acc, v) => {
    acc.L += v.credits?.L || 0;
    acc.T += v.credits?.T || 0;
    acc.P += v.credits?.P || 0;
    acc.S += v.credits?.S || 0;
    acc.C += v.credits?.C || 0;
    acc.H += (v.credits?.L || 0) + (v.credits?.T || 0) + (v.credits?.P || 0) + (v.credits?.S || 0);
    return acc;
  }, { L: 0, T: 0, P: 0, S: 0, C: 0, H: 0 });

  const romanSem = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][semNum - 1] || String(semNum);
  const colWidths = [12, 33, 10, 8, 5, 5, 5, 5, 7, 10]; // Total 100%

  return [
    subHeading(`${romanSem} SEMESTER`),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        // Header Row 1 (Course Credits covers Category, Level, L, T, P, S, Total)
        new TableRow({
          tableHeader: true,
          children: [
            headerCell('Course code', 1, { width: { size: colWidths[0], type: WidthType.PERCENTAGE }, vMerge: VerticalMergeType.RESTART }),
            headerCell('Course Title', 1, { width: { size: colWidths[1], type: WidthType.PERCENTAGE }, vMerge: VerticalMergeType.RESTART }),
            headerCell('Course Credits', 7, { width: { size: colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6] + colWidths[7] + colWidths[8], type: WidthType.PERCENTAGE } }),
            headerCell('Total Hours', 1, { width: { size: colWidths[9], type: WidthType.PERCENTAGE }, vMerge: VerticalMergeType.RESTART }),
          ],
        }),
        // Header Row 2
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({ borders: CELL_BORDER, shading: HEADER_SHADE, vMerge: VerticalMergeType.CONTINUE, children: [] }),
            new TableCell({ borders: CELL_BORDER, shading: HEADER_SHADE, vMerge: VerticalMergeType.CONTINUE, children: [] }),
            headerCell('Category', 1, { width: { size: colWidths[2], type: WidthType.PERCENTAGE } }),
            headerCell('Level', 1, { width: { size: colWidths[3], type: WidthType.PERCENTAGE } }),
            headerCell('L', 1, { width: { size: colWidths[4], type: WidthType.PERCENTAGE } }),
            headerCell('T', 1, { width: { size: colWidths[5], type: WidthType.PERCENTAGE } }),
            headerCell('P', 1, { width: { size: colWidths[6], type: WidthType.PERCENTAGE } }),
            headerCell('S', 1, { width: { size: colWidths[7], type: WidthType.PERCENTAGE } }),
            headerCell('Total', 1, { width: { size: colWidths[8], type: WidthType.PERCENTAGE } }),
            new TableCell({ borders: CELL_BORDER, shading: HEADER_SHADE, vMerge: VerticalMergeType.CONTINUE, children: [] }),
          ],
        }),
        // Data Rows
        ...semCourses.map(v => {
          const l = v.credits?.L || 0;
          const t = v.credits?.T || 0;
          const p = v.credits?.P || 0;
          const s = v.credits?.S || 0;
          const c = v.credits?.C || 0;
          const h = l + t + p + s;
          const lvl = getCourseLevelCode(v);
          return new TableRow({
            children: [
              dataCell(v.courseId?.code || '-'),
              dataCell(v.courseId?.title || '-', { align: AlignmentType.LEFT }),
              dataCell(v.category || '-'),
              dataCell(lvl),
              dataCell(fmtC(l)),
              dataCell(fmtC(t)),
              dataCell(fmtC(p)),
              dataCell(fmtC(s)),
              dataCell(String(c)),
              dataCell(String(h || c)),
            ],
          });
        }),
        // Total row
        new TableRow({
          children: [
            new TableCell({ borders: CELL_BORDER, columnSpan: 4, children: [new Paragraph({ children: [boldRun('Total', { size: pt(9) })], alignment: AlignmentType.RIGHT })] }),
            dataCell(String(totals.L || '')),
            dataCell(String(totals.T || '')),
            dataCell(String(totals.P || '')),
            dataCell(String(totals.S || '')),
            dataCell(String(totals.C || 0), { bold: true }),
            dataCell(String(totals.H || ''), { bold: true }),
          ],
        }),
      ],
    }),
    ...emptyPara(1),
  ];
};

/** CO-PO / CO-PSO Mapping Matrix Table */
const buildMappingTable = (label, outcomes, mappings, columns, mapKey) => {
  if (!outcomes.length || !columns.length) return [];

  const firstColWidth = 15;
  const otherColWidth = Math.floor(85 / columns.length);

  return [
    new Paragraph({
      children: [boldRun(label, { size: pt(9) })],
      spacing: { before: convertMillimetersToTwip(3), after: convertMillimetersToTwip(1) },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell(`CO/${mapKey.toUpperCase()}`, 1, { width: { size: firstColWidth, type: WidthType.PERCENTAGE } }),
            ...columns.map(col => headerCell(col, 1, { width: { size: otherColWidth, type: WidthType.PERCENTAGE } })),
          ],
        }),
        ...outcomes.map(co => {
          const mapping = mappings.find(m => m.coCode === co.coCode)?.[mapKey] || {};
          return new TableRow({
            children: [
              dataCell(co.coCode, { width: { size: firstColWidth, type: WidthType.PERCENTAGE } }),
              ...columns.map(col => dataCell(getMappingValue(mapping, col), { width: { size: otherColWidth, type: WidthType.PERCENTAGE } })),
            ],
          });
        }),
      ],
    }),
    ...emptyPara(1),
  ];
};

/** Legend Columns Helper Table */
const buildLegendTable = (title, items) => {
  if (!items || items.length === 0) return [];
  const tableRows = [];
  for (let i = 0; i < items.length; i += 2) {
    const item1 = items[i];
    const item2 = items[i + 1];
    
    const p1 = item1 ? new Paragraph({
      children: [boldRun(item1.courseId?.keyword || item1.courseId?.code || '', { size: pt(9.5) }), textRun(' - ' + (item1.courseId?.title || ''), { size: pt(9.5) })]
    }) : new Paragraph({ children: [] });
    
    const p2 = item2 ? new Paragraph({
      children: [boldRun(item2.courseId?.keyword || item2.courseId?.code || '', { size: pt(9.5) }), textRun(' - ' + (item2.courseId?.title || ''), { size: pt(9.5) })]
    }) : new Paragraph({ children: [] });
    
    tableRows.push(new TableRow({
      children: [
        new TableCell({
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [p1],
        }),
        new TableCell({
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [p2],
        }),
      ],
    }));
  }
  
  return [
    new Paragraph({
      children: [boldRun(title, { size: pt(11), color: '111827' })],
      spacing: { before: convertMillimetersToTwip(4), after: convertMillimetersToTwip(2) },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
      rows: tableRows,
    }),
    ...emptyPara(1),
  ];
};

/** Individual Course Page */
const buildCourseSection = (v, departmentName) => {
  const outcomes      = v.courseOutcomes || [];
  const units         = v.syllabusUnits  || [];
  const textbooks     = (v.textbooks         || []).map(formatBookEntry).filter(Boolean);
  const refBooks      = (v.referenceMaterials || []).map(formatBookEntry).filter(Boolean);
  const onlineRes     = (v.onlineResources    || []).map(item => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.url ? [item.url, item.description].filter(Boolean).join(' – ') : '';
  }).filter(Boolean);

  const poColumns  = deriveMappingColumns(v.coPoMappings  || [], 'po',  'PO',  11);
  const psoColumns = (v.coPsoMappings || []).length
    ? deriveMappingColumns(v.coPsoMappings || [], 'pso', 'PSO', 2)
    : [];

  const courseTitle = v.courseId?.title || 'Course Title';
  const courseCode  = v.courseId?.code  || '-';
  const L = fmtC(v.credits?.L), T = fmtC(v.credits?.T), P = fmtC(v.credits?.P), S = fmtC(v.credits?.S), C = fmtC(v.credits?.C);

  const commonToText = formatCommonTo(v.offeredFor || [], departmentName);

  const items = [
    new Paragraph({
      children: [new PageBreak(), boldRun(courseTitle, { size: pt(11) })],
      alignment: AlignmentType.CENTER,
      spacing: { before: convertMillimetersToTwip(2), after: convertMillimetersToTwip(1) },
    }),
    new Paragraph({
      children: [boldRun(commonToText, { size: pt(9.5) })],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertMillimetersToTwip(4) },
    }),
    // Code + LTPC
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              width: { size: 65, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [boldRun('Course Code: ', { size: pt(10) }), textRun(courseCode, { size: pt(10) })] })],
            }),
            new TableCell({
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              width: { size: 35, type: WidthType.PERCENTAGE },
              children: [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        headerCell('L', 1, { shading: { fill: 'FFFFFF', type: 'clear' } }),
                        headerCell('T', 1, { shading: { fill: 'FFFFFF', type: 'clear' } }),
                        headerCell('P', 1, { shading: { fill: 'FFFFFF', type: 'clear' } }),
                        headerCell('S', 1, { shading: { fill: 'FFFFFF', type: 'clear' } }),
                        headerCell('C', 1, { shading: { fill: 'FFFFFF', type: 'clear' } }),
                      ]
                    }),
                    new TableRow({
                      children: [
                        dataCell(L),
                        dataCell(T),
                        dataCell(P),
                        dataCell(S),
                        dataCell(C),
                      ]
                    })
                  ]
                })
              ],
            }),
          ],
        }),
      ],
    }),
    ...emptyPara(1),
  ];

  // Course Outcomes
  if (outcomes.length) {
    items.push(
      new Paragraph({ children: [boldRun('Course Outcomes:', { size: pt(10) })], spacing: { after: convertMillimetersToTwip(1) } }),
      new Paragraph({ children: [boldRun('At the end of the course, student will be able to:', { size: pt(9) })], spacing: { after: convertMillimetersToTwip(1) } }),
    );
    outcomes.forEach(co => {
      items.push(new Paragraph({
        children: [boldRun(`${co.coCode}: `, { size: pt(9) }), textRun(co.description || 'Outcome statement not defined.', { size: pt(9) })],
        spacing: { after: convertMillimetersToTwip(1) },
      }));
    });
    items.push(...emptyPara(1));

    // CO-PO table
    if (v.enableCOPO !== false) {
      items.push(...buildMappingTable('Mapping of Course Outcomes with Program Outcomes:', outcomes, v.coPoMappings || [], poColumns, 'po'));
    }

    // CO-PSO table
    if (v.enableCOPSO !== false && psoColumns.length) {
      items.push(...buildMappingTable('Mapping of Course Outcomes with Program Specific Outcomes:', outcomes, v.coPsoMappings || [], psoColumns, 'pso'));
    }
  }

  // Syllabus Units
  if (v.syllabusFormat === 'CUSTOM_CONTENT') {
    const customContent = stripHtml(v.customSyllabusContent || '');
    if (customContent) {
      customContent.split(/\n+/).filter(Boolean).forEach(line => {
        items.push(new Paragraph({ children: [textRun(line, { size: pt(9.8) })], spacing: { after: convertMillimetersToTwip(1.6) } }));
      });
    }
  } else {
    units.forEach((unit, i) => {
      const unitContent = stripHtml(unit.htmlContent || unit.richTextContent || unit.description || '');
      items.push(
        new Paragraph({
          children: [boldRun(`UNIT – ${ROMAN[i] || i + 1}`, { size: pt(10), allCaps: true })],
          spacing: { before: convertMillimetersToTwip(4), after: convertMillimetersToTwip(2) },
        }),
      );
      if (unit.title) items.push(new Paragraph({ children: [boldRun(unit.title, { size: pt(9.8) })], spacing: { after: convertMillimetersToTwip(1) } }));
      if (unitContent) {
        unitContent.split(/\n+/).filter(Boolean).forEach(line => {
          items.push(new Paragraph({ children: [textRun(line, { size: pt(9.8) })], spacing: { after: convertMillimetersToTwip(1.6) } }));
        });
      }
    });
  }

  // References
  const buildRefList = (title, entries) => {
    if (!entries.length) return [];
    return [
      new Paragraph({ children: [boldRun(title, { size: pt(10), allCaps: true })], spacing: { before: convertMillimetersToTwip(4), after: convertMillimetersToTwip(2) } }),
      ...entries.map((entry, i) => new Paragraph({
        children: [boldRun(`${i + 1}. `, { size: pt(9.8) }), textRun(entry, { size: pt(9.8) })],
        spacing: { after: convertMillimetersToTwip(1.6) },
      })),
    ];
  };

  items.push(
    ...buildRefList('Text Books:', textbooks),
    ...buildRefList('Reference Books:', refBooks),
    ...buildRefList('Web Links:', onlineRes),
  );

  return items;
};

const formatBookEntry = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return [item.title, item.author, item.publisher, item.edition].filter(Boolean).join(', ');
};

// ─── VALIDATOR FUNCTION ──────────────────────────────────────────────────────

const validateCurriculumDocx = (dynamicContext) => {
  const { courses } = dynamicContext;

  // Verify that all courses have L, T, P, S, C defined
  for (const v of courses) {
    if (!v.credits || v.credits.L === undefined || v.credits.T === undefined || v.credits.P === undefined || v.credits.S === undefined || v.credits.C === undefined) {
      throw new Error(`[Validation Error] Course ${v.courseId?.code || 'unknown'} has missing LTPSc values.`);
    }
  }

  // Verify we have a non-empty list of courses
  if (courses.length === 0) {
    throw new Error('[Validation Error] Zero courses found to export in the handbook.');
  }

  console.log(`[Validation Success] DOCX data models verified successfully. Course count: ${courses.length}`);
};

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

/**
 * generateCurriculumDocx
 * @returns {Promise<Buffer>} DOCX binary buffer
 */
export const generateCurriculumDocx = async ({
  regulationId,
  departmentId,
  departmentName = 'Computer Science and Engineering',
  departmentCode = 'CSE',
  programName    = 'B. Tech. Four Year Degree Program',
  programCode    = 'B.Tech',
  programTotalCredits = 160,
}) => {
  // ── Fetch Regulation & Shared Context ──
  const regulation = await Regulation.findById(regulationId).lean();
  if (!regulation) throw new Error('Regulation not found.');

  const dynamicContext = await getDynamicCurriculumContext({
    regulation: regulation.code,
    departmentId: departmentId,
  });

  // Run the validator before building
  validateCurriculumDocx(dynamicContext);

  const { courses, allVersions = dynamicContext.courseVersions || [], minorStreams, dbCategories, publishedMinorDegrees } = dynamicContext;

  let programTemplate = {};
  if (regulation.programId) {
    try {
      const prog = await Program.findById(regulation.programId).lean();
      if (prog) {
        programTemplate = prog.curriculumBookTemplate || {};
      }
    } catch (_) {}
  }

  // Default book branding
  const defaultBookTemplate = {
    coverTitle: 'Academic Curriculum & Syllabus Book',
    coverSubtitle: '',
    coverNote: "Accredited by NAAC with 'A++' Grade - Approved by AICTE",
    headerText: 'Aditya University - OBE Curriculum Portal',
    footerText: 'Outcome Based Curriculum Planning & Mapping Portal',
    watermarkText: 'ADITYA UNIVERSITY'
  };

  const regulationLayout = regulation.curriculumLayout || {};
  const resolvedBookLayout = {
    coverTitle: regulationLayout.coverTitle || programTemplate.coverTitle || defaultBookTemplate.coverTitle,
    coverSubtitle: regulationLayout.coverSubtitle || programTemplate.coverSubtitle || defaultBookTemplate.coverSubtitle,
    coverNote: programTemplate.coverNote || defaultBookTemplate.coverNote,
    headerText: regulationLayout.headerText || programTemplate.headerText || defaultBookTemplate.headerText,
    footerText: regulationLayout.footerText || programTemplate.footerText || defaultBookTemplate.footerText,
    watermarkText: regulationLayout.watermarkText || programTemplate.watermarkText || defaultBookTemplate.watermarkText,
    pageBorderStyle: regulationLayout.pageBorderStyle || 'classic',
    accentColor: regulationLayout.accentColor || '#1d4ed8',
  };

  const academicYear   = regulation.academicYear || '2024';
  const semesterCount  = regulation.semesterCount || 8;

  // Category credit totals
  const categoryTotals = courses.reduce((acc, v) => {
    const cat = v.category || 'MCC';
    acc[cat] = (acc[cat] || 0) + (v.credits?.C || 0);
    return acc;
  }, {});

  // Fetch dept minor degrees list
  const MinorDegree = (await import('../models/MinorDegree.js')).default;
  const deptMinorDegrees = departmentId
    ? await MinorDegree.find({ regulationId, departmentId, isDeleted: { $ne: true } }).lean()
    : [];

  const logoBuffer = getLogoBuffer();

  const makeFooter = () => new Footer({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: { style: BorderStyle.SINGLE, size: 6, color: '000000' }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE } },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ children: [textRun(`${programCode} (${departmentCode}) Curriculum-${academicYear}`, { size: pt(9), color: '374151' })], alignment: AlignmentType.LEFT })
                ],
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      textRun('Page ', { size: pt(9), color: '374151' }),
                      new TextRun({ children: [PageNumber.CURRENT], size: pt(9), color: '374151' }),
                      textRun(' of ', { size: pt(9), color: '374151' }),
                      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: pt(9), color: '374151' }),
                    ],
                    alignment: AlignmentType.RIGHT,
                  })
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // ─────────────────────────────────────────────────────────
  //  SECTION 1: COVER PAGE
  // ─────────────────────────────────────────────────────────
  const coverChildren = [
    // 1. Cover Title
    new Paragraph({
      children: [boldRun(resolvedBookLayout.coverTitle.toUpperCase(), { size: pt(24), color: '111827' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: convertMillimetersToTwip(20), after: convertMillimetersToTwip(10) },
    }),
    // 2. Department Name Box (Styled Rounded Title Box replica using borders and shadow)
    buildDeptTitleBox(departmentName),
    emptyPara(2)[0],
    // 3. 'for'
    new Paragraph({
      children: [textRun('for', { size: pt(11), color: '374151' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertMillimetersToTwip(10) },
    }),
    // 4. Program Degree
    new Paragraph({
      children: [boldRun(programName.toUpperCase(), { size: pt(16), color: '991B1B' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertMillimetersToTwip(10) },
    }),
    // 5. Admission batch note
    new Paragraph({
      children: [textRun(`(Applicable for the batches admitted from A.Y. ${academicYear}-${String(Number(academicYear) + 1).slice(-2)})`, { size: pt(11), color: '374151', bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertMillimetersToTwip(20) },
    }),
    // 6. Cover Subtitle (optional)
    ...(resolvedBookLayout.coverSubtitle ? [
      new Paragraph({
        children: [textRun(resolvedBookLayout.coverSubtitle, { size: pt(11), color: '374151' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: convertMillimetersToTwip(10) },
      })
    ] : []),
    // 7. Logo
    ...(logoBuffer ? [
      new Paragraph({
        children: [new ImageRun({ data: logoBuffer, transformation: { width: 180, height: 60 } })],
        alignment: AlignmentType.CENTER,
        spacing: { before: convertMillimetersToTwip(15), after: convertMillimetersToTwip(5) },
      }),
    ] : []),
    // 8. Address
    new Paragraph({
      children: [textRun('Aditya Nagar, ADB Road, Surampalem - 533 437', { size: pt(11), color: '374151' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertMillimetersToTwip(2) },
    }),
    // 9. Cover Note
    new Paragraph({
      children: [boldRun(resolvedBookLayout.coverNote, { size: pt(10), color: '374151', italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertMillimetersToTwip(10) },
    }),
  ];

  // ─────────────────────────────────────────────────────────
  //  SECTION 2: DEPARTMENT FRONTMATTER
  // ─────────────────────────────────────────────────────────
  const frontmatterSection = [
    new Paragraph({
      children: [boldRun(`Department of ${departmentName}`, { size: pt(14), color: '111827' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: convertMillimetersToTwip(10), after: convertMillimetersToTwip(4) },
    }),
    new Paragraph({
      children: [boldRun(`${programName} (${departmentCode}) Program Curriculum-${academicYear}`, { size: pt(12), color: '111827' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertMillimetersToTwip(2) },
    }),
    new Paragraph({
      children: [textRun(`(Applicable for the batches admitted from the A.Y. ${academicYear}-${String(Number(academicYear) + 1).slice(-2)})`, { size: pt(10.5), italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertMillimetersToTwip(8) },
    }),
    new Paragraph({
      children: [boldRun('UG Programs Offered', { size: pt(12), color: '991B1B' })],
      spacing: { before: convertMillimetersToTwip(5), after: convertMillimetersToTwip(2) },
    }),
    new Paragraph({
      children: [boldRun('B.Tech in', { size: pt(11) })],
      spacing: { after: convertMillimetersToTwip(1) },
    }),
    new Paragraph({
      children: [textRun(`• (${departmentName})`, { size: pt(10.5) })],
      spacing: { after: convertMillimetersToTwip(1) },
    }),
    ...deptMinorDegrees.map(md => new Paragraph({
      children: [textRun(`• (${departmentName}) with a Minor Degree in ${md.minorName || md.name}`, { size: pt(10.5) })],
      spacing: { after: convertMillimetersToTwip(1) },
    })),
    new Paragraph({
      children: [boldRun(`Minor Streams offered in Undergraduate (${departmentName})`, { size: pt(11), color: '991B1B' })],
      spacing: { before: convertMillimetersToTwip(5), after: convertMillimetersToTwip(2) },
    }),
    ...(minorStreams.length > 0
      ? minorStreams.map(stream => new Paragraph({
          children: [textRun(`• ${stream.name}`, { size: pt(10.5) })],
          spacing: { after: convertMillimetersToTwip(1) },
        }))
      : [new Paragraph({ children: [textRun('• Minor streams will be listed after configuration.', { size: pt(10.5), italics: true })] })]),
    new Paragraph({ children: [new PageBreak()] })
  ];

  // ─────────────────────────────────────────────────────────
  //  SECTION 3: CREDIT DIVISION
  // ─────────────────────────────────────────────────────────
  const creditSection = [
    sectionHeading('Credit Division Category-wise'),
    new Paragraph({
      children: [
        boldRun('Foundation Courses – FC  |  ', { size: pt(10) }),
        boldRun('Intermediate-level Courses – IC  |  ', { size: pt(10) }),
        boldRun('Advanced Courses – AC', { size: pt(10) }),
      ],
      spacing: { after: convertMillimetersToTwip(4) },
    }),
    buildCreditDivisionTable(dbCategories, categoryTotals, programTotalCredits),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ─────────────────────────────────────────────────────────
  //  SECTION 4: CATEGORY-WISE COURSE TABLES
  // ─────────────────────────────────────────────────────────
  const categoryTablesSection = [
    ...dbCategories.flatMap(cat => {
      if (cat.code === 'MSC' || cat.code === 'UEC' || cat.code === 'MSC/UEC') return [];
      const rows = courses.filter(v => (v.category || 'MCC') === cat.code);
      if (!rows.length) return [];
      return buildCategoryTable(cat.name || cat.code, rows);
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ─────────────────────────────────────────────────────────
  //  SECTION 5: MINOR STREAM FLOWCHART & TABLES
  // ─────────────────────────────────────────────────────────
  const minorStreamsTables = minorStreams.length ? [
    ...buildMinorStreamFlowchart(minorStreams, allVersions),
    new Paragraph({ children: [new PageBreak()] }),
    ...minorStreams.flatMap(stream => {
      const streamCourses = (stream.courses || []).map(c => {
        const version = allVersions.find(v => String(v.courseId?._id || v.courseId) === String(c._id));
        return version || {
          courseId: c,
          category: 'MSC',
          level: '',
          credits: { L: 0, T: 0, P: 0, S: 0, C: 0 },
          cieSee: { cieMaxMarks: 50, seeMaxMarks: 50 },
        };
      });
      return buildCategoryTable(`Minor Stream: ${stream.name}`, streamCourses);
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ] : [];

  // ─────────────────────────────────────────────────────────
  //  SECTION 6: UNIVERSITY OPEN ELECTIVES
  // ─────────────────────────────────────────────────────────
  const uecStreams = {
    'AI & ML': [],
    'Production Excellence': [],
    'Supply Chain Management': [],
    'Sustainability': [],
    'Security': [],
    'Others': [],
  };

  allVersions.forEach(v => {
    if (v.category !== 'UEC') return;
    const streamName = getUecStream(v);
    uecStreams[streamName].push(v);
  });

  const uecSection = [];
  let hasUec = false;
  Object.values(uecStreams).forEach(list => { if (list.length > 0) hasUec = true; });

  if (hasUec) {
    uecSection.push(
      new Paragraph({
        children: [boldRun('UNIVERSITY OPEN ELECTIVE COURSES', { size: pt(13), color: '111827' })],
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { before: convertMillimetersToTwip(8), after: convertMillimetersToTwip(5) },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '111827' } },
      })
    );
    Object.entries(uecStreams).forEach(([streamName, list]) => {
      if (list.length === 0) return;
      uecSection.push(
        new Paragraph({ children: [new PageBreak()] }),
        ...buildUecTable(streamName, list)
      );
    });
    uecSection.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // ─────────────────────────────────────────────────────────
  //  SECTION 7: LEVEL-WISE COURSE TABLES
  // ─────────────────────────────────────────────────────────
  const fcRows = courses.filter(v => getCourseLevelCode(v) === 'FC');
  const icRows = courses.filter(v => getCourseLevelCode(v) === 'IC');
  const acRows = courses.filter(v => getCourseLevelCode(v) === 'AC');

  const levelSection = [
    ...(fcRows.length ? buildLevelTable('Foundation Courses (FC)', fcRows) : []),
    ...(icRows.length ? buildLevelTable('Intermediate-Level Courses (IC)', icRows) : []),
    ...(acRows.length ? buildLevelTable('Advanced Courses (AC)', acRows) : []),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ─────────────────────────────────────────────────────────
  //  SECTION 7B: PREREQUISITE FLOW CHART (CSE)
  // ─────────────────────────────────────────────────────────
  const prereqFlowSection = [
    ...buildPrereqFlowchart(courses),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ─────────────────────────────────────────────────────────
  //  SECTION 8: COURSE ABBREVIATION LEGEND
  // ─────────────────────────────────────────────────────────
  const fcLegendItems = courses.filter(v => {
    if (v.category && v.category.toLowerCase().includes('msc')) return false;
    return getCourseLevelCode(v) === 'FC';
  });
  
  const icLegendItems = courses.filter(v => {
    if (v.category && v.category.toLowerCase().includes('msc')) return false;
    return getCourseLevelCode(v) === 'IC';
  });
  
  const acLegendItems = courses.filter(v => {
    if (v.category && v.category.toLowerCase().includes('msc')) return false;
    return getCourseLevelCode(v) === 'AC';
  });

  const legendSection = [
    ...buildLegendTable('Foundation Level Courses:', fcLegendItems),
    ...buildLegendTable('Intermediate Level Courses:', icLegendItems),
    ...buildLegendTable('Advanced Level Courses:', acLegendItems),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ─────────────────────────────────────────────────────────
  //  SECTION 9: Suggestive Semester-wise Curriculum
  // ─────────────────────────────────────────────────────────
  const semesterSection = [
    new Paragraph({
      children: [boldRun('Suggestive Semester-wise Curriculum', { size: pt(13), color: '111827' })],
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { before: convertMillimetersToTwip(8), after: convertMillimetersToTwip(5) },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '111827' } },
    }),
    ...Array.from({ length: semesterCount }, (_, i) => {
      const semNum = i + 1;
      const semCourses = courses.filter(v => v.semester === semNum);
      if (!semCourses.length) return [];
      return buildSemesterTable(semNum, semCourses);
    }).flat(),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ─────────────────────────────────────────────────────────
  //  SECTION 10: MINOR DEGREES
  // ─────────────────────────────────────────────────────────
  const minorDegreesSection = Object.keys(publishedMinorDegrees).length ? [
    ...buildMinorDegreeFlowchart(publishedMinorDegrees, allVersions),
    new Paragraph({ children: [new PageBreak()] }),
    ...Object.keys(publishedMinorDegrees).flatMap((deptName, deptIdx) => {
      const isFirst = deptIdx === 0;
      return [
        ...(isFirst ? [
          new Paragraph({
            children: [boldRun('* To acquire a minor degree, a student has to earn 20 credits in addition to the 160 credits.', { size: pt(10), color: '374151' })],
            spacing: { before: convertMillimetersToTwip(5), after: convertMillimetersToTwip(3) },
          })
        ] : []),
        ...publishedMinorDegrees[deptName].flatMap(minor => {
          let sumL = 0, sumT = 0, sumP = 0, sumS = 0, sumC = 0;
          const groupSizes = {};
          (minor.courses || []).forEach(c => {
            if (c.orGroupId) groupSizes[c.orGroupId] = (groupSizes[c.orGroupId] || 0) + 1;
          });
          const renderedGroups = new Set();
          const groupCounters = {};

          const colWidths = [12, 28, 10, 5, 5, 5, 5, 5, 6, 6, 6, 12];

          return [
            new Paragraph({
              children: [boldRun(`Minor Degree in ${minor.minorName}`, { size: pt(11), color: '000000' })],
              spacing: { before: convertMillimetersToTwip(4), after: convertMillimetersToTwip(2) },
            }),
            new Paragraph({
              children: [textRun('(offered to other branches students)', { size: pt(9.5), italics: true })],
              spacing: { after: convertMillimetersToTwip(2) },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              rows: [
                new TableRow({
                  tableHeader: true,
                  children: [
                    headerCell('Course Code', 1, { width: { size: colWidths[0], type: WidthType.PERCENTAGE } }),
                    headerCell('Course Name', 1, { width: { size: colWidths[1], type: WidthType.PERCENTAGE }, align: AlignmentType.LEFT }),
                    headerCell('Level', 1, { width: { size: colWidths[2], type: WidthType.PERCENTAGE } }),
                    headerCell('L', 1, { width: { size: colWidths[3], type: WidthType.PERCENTAGE } }),
                    headerCell('T', 1, { width: { size: colWidths[4], type: WidthType.PERCENTAGE } }),
                    headerCell('P', 1, { width: { size: colWidths[5], type: WidthType.PERCENTAGE } }),
                    headerCell('S', 1, { width: { size: colWidths[6], type: WidthType.PERCENTAGE } }),
                    headerCell('C', 1, { width: { size: colWidths[7], type: WidthType.PERCENTAGE } }),
                    headerCell('CIE', 1, { width: { size: colWidths[8], type: WidthType.PERCENTAGE } }),
                    headerCell('SEE', 1, { width: { size: colWidths[9], type: WidthType.PERCENTAGE } }),
                    headerCell('Total', 1, { width: { size: colWidths[10], type: WidthType.PERCENTAGE } }),
                    headerCell('Pre-requisite', 1, { width: { size: colWidths[11], type: WidthType.PERCENTAGE } }),
                  ]
                }),
                ...(() => {
                  const rows = (minor.courses || []).map(c => {
                    const v = allVersions.find(ver => ver.courseId?.code === c.courseCode);
                    const level = v?.courseLevel || v?.level || c.level || 'IC';
                    const L = v?.credits?.L || 0;
                    const T = v?.credits?.T || 0;
                    const P = v?.credits?.P || 0;
                    const S = v?.credits?.S || 0;
                    const C = v?.credits?.C || c.credits;
                    const CIE = v?.cieSee?.cieMaxMarks || 50;
                    const SEE = v?.cieSee?.seeMaxMarks || 50;
                    const total = CIE + SEE;
                    
                    const isGrouped = !!c.orGroupId;
                    const isFirstInGroup = isGrouped && !renderedGroups.has(c.orGroupId);
                    const groupSize = isGrouped ? groupSizes[c.orGroupId] : 1;
                    if (isGrouped) {
                      renderedGroups.add(c.orGroupId);
                      groupCounters[c.orGroupId] = (groupCounters[c.orGroupId] || 0) + 1;
                    }
                    const isLastInGroup = isGrouped && groupCounters[c.orGroupId] === groupSize;
                    const appendOr = isGrouped && !isLastInGroup;
                    const skipMergedColumns = isGrouped && !isFirstInGroup;

                    const vMergeType = isGrouped ? (isFirstInGroup ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE) : undefined;

                    if (!skipMergedColumns) {
                      sumL += L; sumT += T; sumP += P; sumS += S; sumC += C;
                    }

                    const prereqs = v ? prereqLinks.filter(l => String(l.targetCourseId?._id || l.targetCourseId) === String(v.courseId?._id)) : [];
                    const prereqStr = prereqs.length > 0 
                      ? prereqs.map(l => l.sourceCourseId?.keyword || l.sourceCourseId?.code || '').filter(Boolean).join(', ') 
                      : '-';

                    return new TableRow({
                      children: [
                        dataCell(c.courseCode),
                        dataCell(c.courseName + (appendOr ? ' (or)' : ''), { align: AlignmentType.LEFT }),
                        dataCell(skipMergedColumns ? '' : String(level)),
                        dataCell(String(L || '')),
                        dataCell(String(T || '')),
                        dataCell(String(P || '')),
                        dataCell(String(S || '')),
                        dataCell(skipMergedColumns ? '' : String(C), { bold: true }),
                        dataCell(skipMergedColumns ? '' : String(CIE)),
                        dataCell(skipMergedColumns ? '' : String(SEE)),
                        dataCell(skipMergedColumns ? '' : String(total)),
                        dataCell(skipMergedColumns ? '' : (prereqStr || '-')),
                      ]
                    });
                  });

                  rows.push(new TableRow({
                    children: [
                      new TableCell({ borders: CELL_BORDER, columnSpan: 3, children: [new Paragraph({ children: [boldRun('Total', { size: pt(9) })], alignment: AlignmentType.CENTER })] }),
                      dataCell(String(sumL), { bold: true }),
                      dataCell(String(sumT), { bold: true }),
                      dataCell(String(sumP), { bold: true }),
                      dataCell(String(sumS), { bold: true }),
                      dataCell(String(sumC), { bold: true }),
                      new TableCell({ borders: CELL_BORDER, columnSpan: 4, children: [new Paragraph({ children: [textRun('')], alignment: AlignmentType.CENTER })] }),
                    ]
                  }));
                  return rows;
                })()
              ]
            }),
            ...emptyPara(1)
          ];
        })
      ];
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ] : [];

  // ─────────────────────────────────────────────────────────
  //  SECTION 11: INDIVIDUAL COURSE PAGES
  // ─────────────────────────────────────────────────────────
  const coursesSectionHeading = [
    new Paragraph({
      children: [boldRun('Detailed Course Syllabi', { size: pt(13), color: '111827' })],
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { before: convertMillimetersToTwip(8), after: convertMillimetersToTwip(5) },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '111827' } },
    })
  ];
  const coursePagesChildren = courses.flatMap(v => buildCourseSection(v, departmentName));

  // ── Assemble Document ──
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: pt(10.5), color: '0a0a0a' },
        },
      },
    },
    sections: [
      // Cover (no header/footer, double page outline borders)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: { size: { orientation: 'portrait' } },
          pageBorders: {
            top:    { style: BorderStyle.DOUBLE, size: 12, color: '111827', space: 24 },
            bottom: { style: BorderStyle.DOUBLE, size: 12, color: '111827', space: 24 },
            left:   { style: BorderStyle.DOUBLE, size: 12, color: '111827', space: 24 },
            right:  { style: BorderStyle.DOUBLE, size: 12, color: '111827', space: 24 },
          }
        },
        children: coverChildren,
      },
      // Main content sections (with footer only)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: { size: { orientation: 'portrait' }, margin: { top: convertMillimetersToTwip(20), bottom: convertMillimetersToTwip(20), left: convertMillimetersToTwip(18), right: convertMillimetersToTwip(18) } },
        },
        headers: {}, 
        footers: { default: makeFooter() },
        children: [
          ...frontmatterSection,
          ...creditSection,
          ...categoryTablesSection,
          ...minorStreamsTables,
          ...uecSection,
          ...levelSection,
          ...prereqFlowSection,
          ...legendSection,
          ...semesterSection,
          ...minorDegreesSection,
          ...coursesSectionHeading,
          ...coursePagesChildren,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
};
