import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useContextStore } from '../../store/contextStore';
import { 
  FileText, Download, Printer, BookOpen, Layers, Award, Sparkles, 
  HelpCircle, ChevronRight, Activity, ArrowRight, Grid3X3, Database
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
// CODEx-added: Uses the existing university logo asset to match the reference PDF cover and page header style.
import adityaLogo from '../../assets/aditya-logo.png';
import { PdfCoursePage, PdfCoursePageStyles } from './PdfCoursePage';

export const CurriculumBookGenerator: React.FC = () => {
  const { selectedProgram, selectedDepartment, selectedRegulation } = useContextStore();
  const [loading, setLoading] = useState(false);
  const [peoPso, setPeoPso] = useState<any>({ peos: [], psos: [], pos: [] });
  const [courseVersions, setCourseVersions] = useState<any[]>([]);
  const [prereqLinks, setPrereqLinks] = useState<any[]>([]);
  const [minorStreams, setMinorStreams] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  
  // Loaded context data
  const [programDetails, setProgramDetails] = useState<any>(null);
  // CODEx-added start: Default curriculum book branding used when Admin has not configured a program/regulation.
  const defaultBookTemplate = {
    coverTitle: 'Academic Curriculum & Syllabus Book',
    coverSubtitle: '',
    coverNote: "Accredited by NAAC with 'A++' Grade - Approved by AICTE",
    headerText: 'Aditya University - OBE Curriculum Portal',
    footerText: 'Outcome Based Curriculum Planning & Mapping Portal',
    watermarkText: 'ADITYA UNIVERSITY'
  };
  // CODEx-added end

  // CODEx-added start: Merge program-level defaults with regulation-level overrides for this handbook.
  const programTemplate = programDetails?.curriculumBookTemplate || {};
  // CODEx-added: Regulation layout overrides win over program defaults for the selected regulation.
  const regulationLayout = selectedRegulation?.curriculumLayout || {};
  // CODEx-added: Resolved handbook layout drives preview, print, and DOCX content.
  const resolvedBookLayout = {
    coverTitle: regulationLayout.coverTitle || programTemplate.coverTitle || defaultBookTemplate.coverTitle,
    coverSubtitle: regulationLayout.coverSubtitle || programTemplate.coverSubtitle || defaultBookTemplate.coverSubtitle,
    coverNote: programTemplate.coverNote || defaultBookTemplate.coverNote,
    headerText: regulationLayout.headerText || programTemplate.headerText || defaultBookTemplate.headerText,
    footerText: regulationLayout.footerText || programTemplate.footerText || defaultBookTemplate.footerText,
    watermarkText: regulationLayout.watermarkText || programTemplate.watermarkText || defaultBookTemplate.watermarkText,
    pageBorderStyle: regulationLayout.pageBorderStyle || 'classic',
    accentColor: regulationLayout.accentColor || '#1d4ed8'
  };
  // CODEx-added end

  // CODEx-added start: Computes the cover page border class from the selected regulation layout.
  const coverBorderClass = resolvedBookLayout.pageBorderStyle === 'none'
    ? 'border-0'
    : resolvedBookLayout.pageBorderStyle === 'minimal'
    ? 'border border-slate-500'
    : 'border-4 border-double border-slate-800';
  // CODEx-added end

  useEffect(() => {
    const loadData = async () => {
      if (!selectedDepartment || !selectedRegulation || !selectedProgram) return;
      setLoading(true);
      try {
        // Fetch detailed program context
        const progRes = await api.programs.list();
        const fullProg = progRes.programs.find((p: any) => p._id === selectedProgram._id);
        setProgramDetails(fullProg);

        // Fetch PEOs/PSOs/POs
        const peoRes = await api.peoPso.getByDept(selectedDepartment._id);
        if (peoRes.peoPso) setPeoPso(peoRes.peoPso);

        // Fetch Course Versions
        const verRes = await api.courses.listByReg(selectedRegulation._id);
        setCourseVersions(verRes.versions || []);

        // Fetch Prerequisites
        const prereqRes = await api.prerequisites.list({ regulationId: selectedRegulation._id });
        setPrereqLinks(prereqRes.links || []);

        // Fetch Minor Streams
        const minorRes = await api.minorStreams.list({ departmentId: selectedDepartment._id, regulationId: selectedRegulation._id });
        setMinorStreams(minorRes.streams || []);

        // Fetch Course Categories from DB
        try {
          const catRes = await api.courseCategories.list();
          setDbCategories(catRes.categories || []);
        } catch (e) {
          console.error('Failed to load DB course categories', e);
        }
      } catch (err) {
        console.error('Failed to load handbook generator data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedProgram, selectedDepartment, selectedRegulation]);

  const handlePrint = () => {
    window.print();
  };

  // DOCX Generation
  const handleExportDocx = async () => {
    if (!selectedRegulation || !selectedDepartment) return;
    
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    // CODEx-added: Uses the resolved Admin-configured cover title in DOCX export.
                    text: resolvedBookLayout.coverTitle,
                    bold: true,
                    size: 32,
                  }),
                ],
              }),
              // CODEx-added start: Includes program/regulation cover subtitle and branding metadata in DOCX export.
              new Paragraph({
                children: [
                  new TextRun({
                    text: resolvedBookLayout.coverSubtitle || `${selectedProgram?.name || 'B.Tech'} - ${selectedDepartment.name}`,
                    bold: true,
                    size: 26,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `ACADEMIC REGULATION HANDBOOK: ${selectedRegulation.code}`,
                    bold: true,
                    size: 20,
                  }),
                ],
              }),
              new Paragraph({
                text: `Header: ${resolvedBookLayout.headerText}`,
                spacing: { before: 160 }
              }),
              new Paragraph({
                text: `Watermark: ${resolvedBookLayout.watermarkText}`,
                spacing: { before: 80 }
              }),
              new Paragraph({
                text: `Footer: ${resolvedBookLayout.footerText}`,
                spacing: { before: 80 }
              }),
              // CODEx-added end
              new Paragraph({
                text: "Generated dynamically from AU OBCPMP Portal",
                spacing: { before: 200 }
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedProgram?.code}_${selectedDepartment.code}_${selectedRegulation.code}_CurriculumBook.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to generate DOCX handbook.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-text-muted">Aggregating Curriculum database structures...</p>
      </div>
    );
  }

  // Live credit totals by category
  // Extract dynamic categories directly from course versions
  const uniqueCategories = Array.from(new Set(courseVersions.map(v => v.category || 'MCC')));
  
  const categoryCredits = uniqueCategories.reduce((acc, cat) => {
    acc[cat] = courseVersions
      .filter(v => (v.category || 'MCC') === cat)
      .reduce((sum, v) => sum + (v.credits?.C || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const grandTotalCredits = (Object.values(categoryCredits) as number[]).reduce((sum, v) => sum + v, 0);

  // Map DB Categories to the row format
  const dynamicCategoryRows = dbCategories.map(cat => ({
    code: cat.code,
    name: cat.name,
    ugc: cat.ugc || '-'
  }));

  const getRowCredits = (code: string) => {
    if (code === 'MSC/UEC') return (categoryCredits['MSC'] || 0) + (categoryCredits['UEC'] || 0);
    return categoryCredits[code] || 0;
  };

  // CODEx-added: Course level buckets mirror the reference PDF's FC/IC/AC grouping.
  const pdfLevelRows = [
    { key: 'FC', title: 'Foundation Courses (FC)' },
    { key: 'IC', title: 'Intermediate-Level Courses (IC)' },
    { key: 'AC', title: 'Advanced Courses (AC)' }
  ];
  // CODEx-added: Semester count follows the selected regulation instead of hard-coded eight semesters.
  const pdfSemesterCount = selectedRegulation?.semesterCount || 8;
  
  // CODEx-added: Shared helper for course rows in category and level tables.
  const getCourseCreditsText = (v: any) => `${v.credits?.L || 0} ${v.credits?.T || 0} ${v.credits?.P || 0} ${v.credits?.S || 0} ${v.credits?.C || 0}`;
  // CODEx-added end

  // CODEx-added start: Reference-PDF page wrapper now acts as a content block, relying on the global print table for headers/footers.
  const PdfPage = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <section className={`pdf-content-section ${className}`}>
      <div className="pdf-page-content">{children}</div>
    </section>
  );
  // CODEx-added end

  // CODEx-added start: Renders a source-PDF-style course category table.
  const renderPdfCourseTable = (title: string, rows: any[]) => (
    <div className="pdf-table-block print:break-inside-avoid">
      <h3 className="pdf-section-title">{title}</h3>
      <table className="pdf-grid-table">
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Name</th>
            <th>Level</th>
            <th>L</th>
            <th>T</th>
            <th>P</th>
            <th>S</th>
            <th>C</th>
            <th>CIE</th>
            <th>SEE</th>
            <th>Total</th>
            <th>Pre-requisite</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v._id}>
              <td>{v.courseId?.code || '-'}</td>
              <td className="text-left">{v.courseId?.title || '-'}</td>
              <td>{v.level || (v.knowledgeLevel?.includes('Advanced') ? 'AC' : v.knowledgeLevel?.includes('Intermediate') ? 'IC' : 'FC')}</td>
              <td>{v.credits?.L || ''}</td>
              <td>{v.credits?.T || ''}</td>
              <td>{v.credits?.P || ''}</td>
              <td>{v.credits?.S || ''}</td>
              <td>{v.credits?.C || ''}</td>
              <td>{v.cieSee?.cieMaxMarks || 50}</td>
              <td>{v.cieSee?.seeMaxMarks || 50}</td>
              <td>{(v.cieSee?.cieMaxMarks || 50) + (v.cieSee?.seeMaxMarks || 50)}</td>
              <td>{v.prerequisites?.[0] || '-'}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td colSpan={3}>Total</td>
            <td>{rows.reduce((sum, v) => sum + (v.credits?.L || 0), 0)}</td>
            <td>{rows.reduce((sum, v) => sum + (v.credits?.T || 0), 0)}</td>
            <td>{rows.reduce((sum, v) => sum + (v.credits?.P || 0), 0)}</td>
            <td>{rows.reduce((sum, v) => sum + (v.credits?.S || 0), 0)}</td>
            <td>{rows.reduce((sum, v) => sum + (v.credits?.C || 0), 0)}</td>
            <td colSpan={4}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
  // CODEx-added end

  // CODEx-added start: Renders one detailed syllabus entry in the compact reference-PDF format.
  const renderPdfSyllabusCourse = (v: any) => (
    <PdfCoursePage
      key={v._id}
      courseVersion={v}
      departmentName={selectedDepartment?.name || 'Computer Science and Engineering'}
      departmentCode={selectedDepartment?.code || 'CSE'}
      regulationYear={selectedRegulation?.academicYear || '2024'}
      forcePageBreak
    />
  );
  // CODEx-added end

  return (
    <div className="space-y-6 font-sans no-print-container">
      {/* Top Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between no-print">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Curriculum Handbook Generator</h1>
          <p className="text-xs text-slate-500 mt-1">One-click compile and generate a complete academic handbook with full syllabus mappings and assessments.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportDocx}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export DOCX</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-12 max-w-[900px] mx-auto print:p-0 print:border-0 print:shadow-none print-layout" id="curriculum-handbook-print-root">
        <PdfCoursePageStyles />
        {/* CODEx-added start: Program/regulation handbook header, footer, and watermark applied to printed preview. */}
        {resolvedBookLayout.headerText && (
          <div className="print-book-header hidden print:block">
            {resolvedBookLayout.headerText}
          </div>
        )}
        {resolvedBookLayout.watermarkText && (
          <div className="print-book-watermark">
            {resolvedBookLayout.watermarkText}
          </div>
        )}
        {resolvedBookLayout.footerText && (
          <div className="print-book-footer hidden print:block">
            {resolvedBookLayout.footerText}
          </div>
        )}
        {/* CODEx-added end */}
        
        {/* SECTION 1: COVER PAGE */}
        {/* CODEx-added: Cover page border now follows the selected regulation layout. */}
        <div className={`pdf-cover-page ${coverBorderClass}`}>
          {/* CODEx-added start: Reference PDF cover structure with formal serif hierarchy and rounded department box. */}
          <div className="pdf-cover-top">
            <h1>{resolvedBookLayout.coverTitle || 'PROGRAM CURRICULUM'}</h1>
            <div className="pdf-cover-dept-box">
              {selectedDepartment?.name || 'Computer Science and Engineering'}
            </div>
          </div>
          <div className="pdf-cover-program">
            <p>for</p>
            <h2>{(programDetails?.degree || 'B. TECH. FOUR YEAR DEGREE PROGRAM').toUpperCase()}</h2>
            <p>(Applicable for the batches admitted from A.Y. {selectedRegulation?.academicYear || '2024'}-{String((selectedRegulation?.academicYear || 2024) + 1).slice(-2)})</p>
            {resolvedBookLayout.coverSubtitle && <p>{resolvedBookLayout.coverSubtitle}</p>}
          </div>
          <div className="pdf-cover-brand">
            <img src={adityaLogo} alt="Aditya University" />
            <p>Aditya Nagar, ADB Road, Surampalem - 533 437</p>
            <p>{resolvedBookLayout.coverNote}</p>
          </div>
          {/* CODEx-added end */}
        </div>

        {/* CODEx-added start: Reference PDF structure pages after cover. */}
        <div className="page-break"></div>

        <div className="print-content-wrapper">
          <div className="print-header hidden print:block">
            <div className="flex justify-between items-start pb-4 pt-4 border-b border-slate-300">
              <div className="text-[10px] font-bold text-slate-600 max-w-[60%]">
                Department of {selectedDepartment?.name || 'Computer Science and Engineering'}<br />
                B.Tech Program Curriculum-{selectedRegulation?.academicYear || '2024'}
              </div>
              <img src={adityaLogo} alt="Aditya University" className="w-[86px] h-auto" />
            </div>
          </div>
          <div className="print-body">

        {/* ── PAGE 2: Department Frontmatter ── */}
        <PdfPage>
          <div className="pdf-frontmatter-header">
            <img src={adityaLogo} alt="Aditya University" className="pdf-frontmatter-logo" />
          </div>
          <div className="pdf-frontmatter">
            <h2>Department of {selectedDepartment?.name || 'Computer Science and Engineering'}</h2>
            <h3>{programDetails?.degree || 'B.Tech'} ({selectedDepartment?.code || 'CSE'}) Program Curriculum-{selectedRegulation?.academicYear || '2024'}</h3>
            <p style={{textAlign:'center'}}>(Applicable for the batches admitted from the A.Y. {selectedRegulation?.academicYear || '2024'}-{String((selectedRegulation?.academicYear || 2024) + 1).slice(-2)})</p>
            <h4>UG Programs Offered</h4>
            <ul className="pdf-arrow-list">
              <li>B. Tech in ({selectedDepartment?.name || 'Computer Science and Engineering'})</li>
              <li>B. Tech in ({selectedDepartment?.name || 'Computer Science and Engineering'}) with
                <ul className="pdf-bullet-list">
                  {minorStreams.length > 0
                    ? minorStreams.map((stream) => <li key={stream._id}>Minor degree in {stream.name}</li>)
                    : <>
                        <li>Minor degree in Civil Engineering</li>
                        <li>Minor degree in Electrical and Electronics Engineering</li>
                        <li>Minor degree in Mechanical Engineering</li>
                      </>
                  }
                </ul>
              </li>
            </ul>
            <h4>Minor Streams offered in {programDetails?.degree || 'B.Tech'} ({selectedDepartment?.name || 'Computer Science and Engineering'})</h4>
            <ul className="pdf-bullet-list">
              {minorStreams.length > 0
                ? minorStreams.map((stream) => <li key={stream._id}>Minor Stream in {stream.name}</li>)
                : <li>Minor streams will be listed after configuration.</li>}
            </ul>
          </div>
        </PdfPage>
        <div className="page-break"></div>

        {/* ── Credit Division Category-wise ── */}
        <PdfPage>
          <h3 className="pdf-section-title">Credit Division Category-wise</h3>
          <table className="pdf-grid-table pdf-credit-table">
            <thead>
              <tr><th>S.No</th><th>Broad Category of Course</th><th>UGC</th><th>Credits</th></tr>
            </thead>
            <tbody>
              {dynamicCategoryRows.map((row, idx) => (
                <tr key={row.code}>
                  <td>{idx + 1}</td>
                  <td className="text-left whitespace-pre-line">{row.name}</td>
                  <td>{row.ugc}</td>
                  <td>{getRowCredits(row.code)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan={2}>Total Credits to be earned for B. Tech Degree</td>
                <td>{programDetails?.totalCredits || 160}</td>
                <td>{grandTotalCredits || programDetails?.totalCredits || 160}</td>
              </tr>
            </tbody>
          </table>
          <div className="pdf-level-note">
            <p><strong>Foundation Courses - FC</strong></p>
            <p><strong>Intermediate-level Courses - IC</strong></p>
            <p><strong>Advanced Courses - AC</strong></p>
          </div>
        </PdfPage>
        <div className="page-break"></div>

        {/* ── PAGES 20-21: Level-wise Course Tables (FC, IC, AC) ── */}
        {(['FC', 'IC', 'AC'] as const).map((levelKey) => {
          const levelLabel = levelKey === 'FC' ? 'Foundation Courses (FC)' : levelKey === 'IC' ? 'Intermediate-Level Courses (IC)' : 'Advanced Courses (AC)';
          const levelRows = courseVersions.filter((v: any) => {
            const lvl = (v.level || v.knowledgeLevel || '');
            if (levelKey === 'FC') return lvl.includes('FC') || lvl.toLowerCase().includes('foundation') || (!lvl);
            if (levelKey === 'IC') return lvl.includes('IC') || lvl.toLowerCase().includes('intermediate');
            return lvl.includes('AC') || lvl.toLowerCase().includes('advanced');
          });
          if (levelRows.length === 0) return null;
          return (
            <PdfPage key={levelKey}>
              <div className="pdf-table-block">
                <table className="pdf-grid-table">
                  <thead>
                    <tr><th colSpan={6} style={{textAlign:'center', fontWeight:900, borderBottom:'2px solid #000'}}>{levelLabel}</th></tr>
                    <tr>
                      <th style={{textAlign:'left'}}>Course Name</th>
                      <th>Category</th>
                      <th>L</th><th>T</th><th>P</th><th>C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levelRows.map((v: any) => (
                      <tr key={v._id}>
                        <td style={{textAlign:'left'}}>{v.courseId?.title || '-'}</td>
                        <td>{v.category || '-'}</td>
                        <td>{v.credits?.L ?? ''}</td>
                        <td>{v.credits?.T || ''}</td>
                        <td>{v.credits?.P || ''}</td>
                        <td>{v.credits?.C ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PdfPage>
          );
        })}
        <div className="page-break"></div>

        {/* ── PAGE 22: Pre-requisite Flow Chart ── */}
        <PdfPage>
          <div className="pdf-prereq-flowchart-page">
            <div className="pdf-prereq-title-box">
              <div>{programDetails?.degree || 'B.Tech'} ({selectedDepartment?.code || 'CSE'}) Program Curriculum</div>
              <div>Pre-requisite Flow Chart</div>
            </div>
            {(['FC', 'IC', 'AC'] as const).map((levelKey) => {
              const bgColor = levelKey === 'FC' ? '#d4edda' : levelKey === 'IC' ? '#f8d7da' : '#fff3cd';
              const levelRows = courseVersions.filter((v: any) => {
                const lvl = (v.level || v.knowledgeLevel || '');
                if (levelKey === 'FC') return lvl.includes('FC') || lvl.toLowerCase().includes('foundation') || !lvl;
                if (levelKey === 'IC') return lvl.includes('IC') || lvl.toLowerCase().includes('intermediate');
                return lvl.includes('AC') || lvl.toLowerCase().includes('advanced');
              });
              return (
                <div key={levelKey} className="pdf-prereq-level-row" style={{background: bgColor}}>
                  <div className="pdf-prereq-level-label">{levelKey}</div>
                  <div className="pdf-prereq-courses-grid">
                    {levelRows.map((v: any) => (
                      <div key={v._id} className="pdf-prereq-course-box">
                        {v.courseId?.code || (v.courseId?.title || '').split(' ').map((w:string) => w[0]).join('').toUpperCase() || '-'}
                      </div>
                    ))}
                    {levelRows.length === 0 && <div className="pdf-prereq-course-box" style={{opacity:0.4}}>—</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </PdfPage>
        <div className="page-break"></div>

        {/* ── PAGE 23: Course Abbreviation Legend ── */}
        <PdfPage>
          <div className="pdf-abbrev-page">
            <div className="pdf-abbrev-columns">
              <div className="pdf-abbrev-col">
                <p className="pdf-abbrev-level-title">Foundation Level Courses:</p>
                {courseVersions
                  .filter((v: any) => { const l=(v.level||v.knowledgeLevel||''); return l.includes('FC')||l.toLowerCase().includes('foundation')||!l; })
                  .map((v: any) => v.courseId?.code
                    ? <p key={v._id} style={{margin:'2px 0',fontSize:'13px'}}><strong>{v.courseId.code}</strong> - {v.courseId.title}</p>
                    : null)}
              </div>
              <div className="pdf-abbrev-col">
                <p className="pdf-abbrev-level-title">Intermediate Level Courses:</p>
                {courseVersions
                  .filter((v: any) => { const l=(v.level||v.knowledgeLevel||''); return l.includes('IC')||l.toLowerCase().includes('intermediate'); })
                  .map((v: any) => v.courseId?.code
                    ? <p key={v._id} style={{margin:'2px 0',fontSize:'13px'}}><strong>{v.courseId.code}</strong> - {v.courseId.title}</p>
                    : null)}
              </div>
            </div>
            <div style={{marginTop:'18px'}}>
              <p className="pdf-abbrev-level-title">Advanced Level Courses:</p>
              <div className="pdf-abbrev-columns">
                {courseVersions
                  .filter((v: any) => { const l=(v.level||v.knowledgeLevel||''); return l.includes('AC')||l.toLowerCase().includes('advanced'); })
                  .map((v: any) => v.courseId?.code
                    ? <p key={v._id} style={{margin:'2px 0',fontSize:'13px'}}><strong>{v.courseId.code}</strong> - {v.courseId.title}</p>
                    : null)}
              </div>
            </div>
          </div>
        </PdfPage>
        <div className="page-break"></div>

        {/* ── PAGES 24-26: Minor Stream Section ── */}
        {minorStreams.length > 0 && (
          <>
            {/* Page 24: Minor Stream Pre-requisite Flowchart */}
            <PdfPage>
              <div className="pdf-prereq-flowchart-page">
                <div className="pdf-prereq-title-box">
                  <div>{programDetails?.degree || 'B.Tech'} ({selectedDepartment?.code || 'CSE'}) Minor Stream</div>
                  <div>Pre-requisite Flowchart</div>
                </div>
                {(['FC', 'IC', 'AC'] as const).map((levelKey) => {
                  const bgColor = levelKey === 'FC' ? '#fffde7' : levelKey === 'IC' ? '#fce4ec' : '#f3e5f5';
                  return (
                    <div key={levelKey} className="pdf-prereq-level-row" style={{background: bgColor}}>
                      <div className="pdf-prereq-level-label">{levelKey}</div>
                      <div className="pdf-prereq-courses-grid">
                        {minorStreams.map((stream: any) => (
                          <div key={stream._id} className="pdf-prereq-course-box" style={{fontSize:'9px', padding:'3px 5px'}}>
                            {stream.name?.split(' ').map((w:string)=>w[0]).join('') || stream.name?.slice(0,4) || 'MS'}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </PdfPage>
            <div className="page-break"></div>

            {/* Pages 25-26: Minor Stream Course Detail Tables (Minor Stream | FC | IC | AC) */}
            <PdfPage>
              <h3 className="pdf-section-title">Minor Stream Course Details</h3>
              <table className="pdf-grid-table" style={{fontSize:'12px'}}>
                <thead>
                  <tr>
                    <th style={{minWidth:'120px', textAlign:'left'}}>Minor Stream</th>
                    <th style={{textDecoration:'underline'}}>FC - Foundation Course</th>
                    <th style={{textDecoration:'underline'}}>IC - Intermediate-Level Course</th>
                    <th style={{textDecoration:'underline'}}>AC - Advanced Course</th>
                  </tr>
                </thead>
                <tbody>
                  {minorStreams.map((stream: any) => {
                    const courses: any[] = stream.courses || [];
                    const fc = courses.filter((c:any)=>(c.level||'').includes('FC')||(c.level||'').toLowerCase().includes('foundation'));
                    const ic = courses.filter((c:any)=>(c.level||'').includes('IC')||(c.level||'').toLowerCase().includes('intermediate'));
                    const ac = courses.filter((c:any)=>(c.level||'').includes('AC')||(c.level||'').toLowerCase().includes('advanced'));
                    const maxRows = Math.max(1, fc.length, ic.length, ac.length);
                    return Array.from({length: maxRows}).map((_: any, i: number) => (
                      <tr key={`${stream._id}-${i}`}>
                        {i === 0 && <td rowSpan={maxRows} style={{textAlign:'left', fontWeight:700, verticalAlign:'top', paddingTop:'6px'}}>{stream.name}</td>}
                        <td style={{textAlign:'left', fontSize:'11px'}}>{fc[i] ? <><strong>{fc[i].code}:</strong> {fc[i].title}</> : ''}</td>
                        <td style={{textAlign:'left', fontSize:'11px'}}>{ic[i] ? <><strong>{ic[i].code}:</strong> {ic[i].title}</> : ''}</td>
                        <td style={{textAlign:'left', fontSize:'11px'}}>{ac[i] ? <><strong>{ac[i].code}:</strong> {ac[i].title}</> : ''}</td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </PdfPage>
            <div className="page-break"></div>
          </>
        )}

        {/* ── Category-wise Course Tables ── */}
        <PdfPage>
          {dynamicCategoryRows.map((cat) => {
            const rows = courseVersions.filter((v) => (v.category || 'MCC') === cat.code);
            if (rows.length === 0) return null;
            return renderPdfCourseTable(cat.name, rows);
          })}
        </PdfPage>
        <div className="page-break"></div>
        <PdfPage>
          <h3 className="pdf-section-title">Semester-wise Course Structure</h3>
          {Array.from({ length: pdfSemesterCount }).map((_, semIdx) => {
            const semNum = semIdx + 1;
            const semCourses = courseVersions.filter((v) => v.semester === semNum);
            if (semCourses.length === 0) return null;
            return (
              <div key={semNum} className="pdf-table-block">
                <h3 className="pdf-section-title">Semester - {semNum}</h3>
                <table className="pdf-grid-table">
                  <thead><tr><th>Course code</th><th>Course Title</th><th>Category</th><th>Course Credits (L T P S)</th><th>Total Credits</th></tr></thead>
                  <tbody>
                    {semCourses.map((v) => <tr key={v._id}><td>{v.courseId?.code || '-'}</td><td className="text-left">{v.courseId?.title || '-'}</td><td>{v.category}</td><td>{getCourseCreditsText(v)}</td><td>{v.credits?.C || 0}</td></tr>)}
                  </tbody>
                </table>
              </div>
            );
          })}
        </PdfPage>
        <div className="page-break"></div>
        {prereqLinks.length > 0 && (
          <PdfPage>
            <h3 className="pdf-section-title">Prerequisite Course Mapping</h3>
            <table className="pdf-grid-table">
              <thead><tr><th>Source Course</th><th>Source Title</th><th>Target Course</th><th>Target Title</th></tr></thead>
              <tbody>
                {prereqLinks.map((link) => <tr key={link._id}><td>{link.sourceCourseId?.code}</td><td className="text-left">{link.sourceCourseId?.title}</td><td>{link.targetCourseId?.code}</td><td className="text-left">{link.targetCourseId?.title}</td></tr>)}
              </tbody>
            </table>
          </PdfPage>
        )}
        {prereqLinks.length > 0 && <div className="page-break"></div>}
        {courseVersions.map((v) => renderPdfSyllabusCourse(v))}
          </div>
          <div className="print-footer hidden print:block">
            <div className="flex justify-between text-[10px] pt-2 pb-4 border-t border-slate-300 text-slate-600 font-bold">
              <span>B.Tech ({selectedDepartment?.code || 'CSE'}) Curriculum-{selectedRegulation?.academicYear || '2024'}</span>
              <span className="css-page-number">Aditya University</span>
            </div>
          </div>
        </div>
        {/* CODEx-added end */}
      </div>

      {/* Global CSS style injecting print definitions print layout */}
      <style>{`
        /* CODEx-added start: Reference-PDF visual system for the generated curriculum book. */
        #curriculum-handbook-print-root {
          background: #f8fafc;
        }
        .pdf-cover-page {
          min-height: 1050px;
          background: #fff;
          padding: 92px 44px 54px;
          text-align: center;
          font-family: "Times New Roman", Times, serif;
          color: #000;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .pdf-cover-top h1 {
          font-size: 30px;
          font-weight: 900;
          letter-spacing: 0;
          margin: 0 0 96px;
        }
        .pdf-cover-dept-box {
          width: 68%;
          margin: 0 auto;
          padding: 28px 28px;
          border: 1.8px solid #000;
          border-radius: 28px;
          box-shadow: 3px 3px 0 #000;
          text-transform: uppercase;
          font-size: 26px;
          line-height: 1.15;
          font-weight: 900;
        }
        .pdf-cover-program {
          display: flex;
          flex-direction: column;
          gap: 26px;
          align-items: center;
        }
        .pdf-cover-program p {
          margin: 0;
          font-size: 19px;
        }
        .pdf-cover-program h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
        }
        .pdf-cover-brand img {
          width: 470px;
          max-width: 85%;
          margin: 0 auto 12px;
        }
        .pdf-cover-brand p {
          margin: 5px 0;
          font-size: 15px;
        }
        /* Page 2 Frontmatter Styles */
        .pdf-frontmatter-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .pdf-frontmatter-logo {
          width: 360px;
          max-width: 80%;
          margin: 0 auto;
        }
        .pdf-arrow-list {
          list-style: none;
          margin: 8px 0 20px 30px;
          padding: 0;
        }
        .pdf-arrow-list > li::before {
          content: "➤ ";
          font-size: 12px;
        }
        .pdf-bullet-list {
          list-style: disc;
          margin: 6px 0 0 30px;
          padding: 0;
        }
        /* Pre-requisite Flowchart Styles (Pages 22, 24) */
        .pdf-prereq-flowchart-page {
          padding: 10px 0;
          font-family: "Times New Roman", Times, serif;
        }
        .pdf-prereq-title-box {
          background: #f5a623;
          color: #000;
          font-weight: 900;
          font-size: 16px;
          text-align: center;
          padding: 10px 20px;
          border-radius: 6px;
          margin: 0 auto 24px;
          max-width: 60%;
          line-height: 1.4;
        }
        .pdf-prereq-level-row {
          display: flex;
          align-items: center;
          border-radius: 8px;
          margin-bottom: 14px;
          padding: 10px 12px;
          min-height: 60px;
        }
        .pdf-prereq-level-label {
          font-weight: 900;
          font-size: 16px;
          min-width: 40px;
          margin-right: 14px;
          color: #000;
        }
        .pdf-prereq-courses-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          flex: 1;
        }
        .pdf-prereq-course-box {
          border: 1.5px solid #333;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
          background: #fff;
          min-width: 44px;
          text-align: center;
        }
        /* Abbreviation Legend Styles (Page 23) */
        .pdf-abbrev-page {
          font-family: "Times New Roman", Times, serif;
          font-size: 14px;
          line-height: 1.5;
        }
        .pdf-abbrev-columns {
          display: flex;
          gap: 30px;
        }
        .pdf-abbrev-col {
          flex: 1;
        }
        .pdf-abbrev-level-title {
          font-weight: 900;
          font-size: 15px;
          margin: 0 0 6px;
        }
        .pdf-abbrev-col p {
          margin: 1px 0;
        }
        
        .pdf-content-section {
          background: #fff;
          position: relative;
          padding: 20px 40px;
          font-family: "Times New Roman", Times, serif;
          color: #000;
        }
        
        .print-content-wrapper {
          width: 100%;
        }
        .print-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: white;
          z-index: 1000;
        }
        .print-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          z-index: 1000;
        }

        .pdf-page-content {
          position: relative;
          z-index: 1;
        }
        .pdf-page-footer {
          position: absolute;
          left: 92px;
          right: 92px;
          bottom: 54px;
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }
        .pdf-frontmatter {
          font-size: 16px;
          line-height: 1.5;
        }
        .pdf-frontmatter h2,
        .pdf-frontmatter h3,
        .pdf-frontmatter h4 {
          text-align: center;
          font-weight: 900;
          margin: 12px 0;
        }
        .pdf-frontmatter ul {
          margin: 8px 0 20px 80px;
        }
        .pdf-section-title {
          text-align: center;
          font-family: "Times New Roman", Times, serif;
          font-size: 16px;
          font-weight: 900;
          margin: 0 0 18px;
        }
        .pdf-table-block {
          margin: 0 0 34px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .pdf-grid-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
          font-family: "Times New Roman", Times, serif;
          font-size: 14px;
          line-height: 1.08;
        }
        .pdf-grid-table th,
        .pdf-grid-table td {
          border: 1px solid #000;
          padding: 3px 6px;
          text-align: center;
          vertical-align: middle;
        }
        .pdf-grid-table th {
          font-weight: 900;
        }
        .pdf-credit-table {
          font-size: 16px;
          line-height: 1.25;
        }
        .pdf-credit-table th,
        .pdf-credit-table td {
          padding: 11px 8px;
        }
        .pdf-level-note {
          width: 70%;
          margin: 8px auto 0;
          font-size: 15px;
          line-height: 1.5;
        }
        .pdf-course-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .pdf-course-header h3 {
          font-size: 16px;
          font-weight: 900;
          margin: 0;
        }
        .pdf-course-header p {
          margin: 2px 0 0;
          font-size: 15px;
        }
        .pdf-course-meta {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 18px;
          font-size: 15px;
        }
        .pdf-mini-table {
          border-collapse: collapse;
          min-width: 160px;
          font-size: 15px;
        }
        .pdf-mini-table th,
        .pdf-mini-table td {
          padding: 4px 12px;
          text-align: center;
          font-weight: 900;
        }
        .pdf-syllabus-section {
          margin: 18px 0;
          font-size: 15px;
          line-height: 1.22;
        }
        .pdf-syllabus-section h4 {
          font-size: 15px;
          font-weight: 900;
          margin: 0 0 4px;
        }
        .pdf-syllabus-section p {
          margin: 3px 0;
        }
        .pdf-matrix-table {
          width: 86%;
          margin: 14px auto;
          font-size: 13px;
        }
        .pdf-unit-block {
          margin: 20px 0;
          font-size: 15px;
          line-height: 1.15;
          text-align: justify;
        }
        .pdf-unit-block h4 {
          font-size: 16px;
          font-weight: 900;
          margin: 0 0 14px;
        }
        .pdf-unit-block p {
          margin: 4px 0;
        }
        /* CODEx-added end */
        @media print {
          body * {
            visibility: hidden;
          }
          #curriculum-handbook-print-root, #curriculum-handbook-print-root * {
            visibility: visible;
          }
          #curriculum-handbook-print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          .print-layout {
            display: block !important;
          }
          @page {
            margin: 25mm 15mm 20mm 15mm;
            @bottom-right {
              content: "Page " counter(page);
            }
          }
          .print-body {
            padding-top: 5mm; /* Header space */
          }
          /* CODEx-added start: Print-only header, footer, and watermark for curriculum books. */
          .print-book-header {
            display: none !important;
          }
          .print-book-footer {
            display: none !important;
          }
          .print-book-watermark {
            position: fixed;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-32deg);
            z-index: 0;
            font-size: 58px;
            font-weight: 900;
            letter-spacing: 8px;
            color: rgba(15, 23, 42, 0.06);
            pointer-events: none;
            white-space: nowrap;
          }
          /* CODEx-added end */
        }
        /* CODEx-added start: On-screen watermark preview for curriculum book layout review. */
        .print-book-watermark {
          position: fixed;
          top: 50%;
          left: 58%;
          transform: translate(-50%, -50%) rotate(-32deg);
          z-index: 0;
          font-size: 58px;
          font-weight: 900;
          letter-spacing: 8px;
          color: rgba(15, 23, 42, 0.045);
          pointer-events: none;
          white-space: nowrap;
        }
        /* CODEx-added end */
      `}</style>
    </div>
  );
};

export default CurriculumBookGenerator;
