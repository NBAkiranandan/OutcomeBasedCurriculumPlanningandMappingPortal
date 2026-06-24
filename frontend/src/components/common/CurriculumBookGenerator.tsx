import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useContextStore } from '../../store/contextStore';
import {
  FileText, Download, Printer, BookOpen, Layers, Award, Sparkles,
  HelpCircle, ChevronRight, Activity, ArrowRight, Grid3X3, Database,
  Loader2, CheckCircle2, XCircle, FileDown
} from 'lucide-react';
// CODEx-added: Uses the existing university logo asset to match the reference PDF cover and page header style.
import adityaLogo from '../../assets/aditya-logo.png';
import { PdfCoursePage, PdfCoursePageStyles } from './PdfCoursePage';
import Xarrow, { Xwrapper } from 'react-xarrows';

export const CurriculumBookGenerator: React.FC = () => {
  const { selectedProgram, selectedDepartment, selectedRegulation } = useContextStore();
  const [loading, setLoading] = useState(false);
  const [peoPso, setPeoPso] = useState<any>({ peos: [], psos: [], pos: [] });
  const [courseVersions, setCourseVersions] = useState<any[]>([]);
  const [prereqLinks, setPrereqLinks] = useState<any[]>([]);
  const [minorStreams, setMinorStreams] = useState<any[]>([]);
  const [publishedMinorDegrees, setPublishedMinorDegrees] = useState<any>({});
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  // Export state
  const [pdfExporting, setPdfExporting] = useState(false);
  const [docxExporting, setDocxExporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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

  // Loaded context data for the on-screen preview
  const [programDetails, setProgramDetails] = useState<any>(null);

  // CODEx-added start: Merge program-level defaults with regulation-level overrides.
  const programTemplate = programDetails?.curriculumBookTemplate || {};
  const regulationLayout = (selectedRegulation as any)?.curriculumLayout || {};
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
      try {
        const progRes = await api.programs.list();
        const fullProg = progRes.programs.find((p: any) => p._id === selectedProgram._id);
        setProgramDetails(fullProg);
      } catch (err) { console.error('Failed to load program', err); }

      try {
        const peoRes = await api.peoPso.getByDept(selectedDepartment._id);
        if (peoRes.peoPso) setPeoPso(peoRes.peoPso);
      } catch (err) { console.error('Failed to load peoPso', err); }

      try {
        const verRes = await api.courses.listByReg(selectedRegulation._id);
        const allVersions = verRes.versions || [];
        setCourseVersions(allVersions);
      } catch (err) { console.error('Failed to load courses', err); }

      try {
        const prereqRes = await api.prerequisites.list({ regulationId: selectedRegulation._id });
        setPrereqLinks(prereqRes.links || []);
      } catch (err) { console.error('Failed to load prerequisites', err); }

      try {
        const minorRes = await api.minorStreams.list({ departmentId: selectedDepartment._id, regulationId: selectedRegulation._id });
        setMinorStreams(minorRes.streams || []);
      } catch (err) { console.error('Failed to load minor streams', err); }

      try {
        const pbRes = await api.minorDegrees.getAllPublished({ regulationId: selectedRegulation._id });
        setPublishedMinorDegrees(pbRes.publishedMinorDegrees || {});
      } catch (e) { console.error('Failed to load published minor degrees', e); }

      try {
        const catRes = await api.courseCategories.list();
        setDbCategories(catRes.categories || []);
      } catch (e) { console.error('Failed to load DB course categories', e); }
      } catch (err) {
        console.error('Failed to load handbook generator data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedProgram, selectedDepartment, selectedRegulation]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const handlePrintPreview = () => {
    window.print();
  };

  // PDF Export via Puppeteer backend
  const handleExportPdf = async () => {
    if (!selectedRegulation || !selectedDepartment) {
      showToast('error', 'Please select a regulation and department first.');
      return;
    }
    setPdfExporting(true);
    try {
      const printRoot = document.getElementById('curriculum-handbook-print-root');
      if (!printRoot) throw new Error('PDF layout not found on page.');

      const clonedRoot = printRoot.cloneNode(true) as HTMLElement;
      // Strip out the non-printable buttons or toolbars if they exist inside the root, though they should be outside.

      const htmlContent = clonedRoot.outerHTML;
      let styles = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
        styles += el.outerHTML;
      });

      await (api.curriculumBooks as any).exportPdf({
        htmlContent,
        styles,
        baseUrl: window.location.origin
      });
      showToast('success', 'PDF exported successfully!');
    } catch (err: any) {
      console.error('[PDF Export]', err);
      showToast('error', err?.message || 'Failed to export PDF. Please try again.');
    } finally {
      setPdfExporting(false);
    }
  };

  // DOCX Export via backend curriculumDocxService
  const handleExportDocx = async () => {
    if (!selectedRegulation || !selectedDepartment) {
      showToast('error', 'Please select a regulation and department first.');
      return;
    }
    setDocxExporting(true);
    try {
      await (api.curriculumBooks as any).exportDocx({
        regulationId: selectedRegulation._id,
        departmentId: selectedDepartment._id,
      });
      showToast('success', 'Word document exported successfully!');
    } catch (err: any) {
      console.error('[DOCX Export]', err);
      showToast('error', err?.message || 'Failed to export DOCX. Please try again.');
    } finally {
      setDocxExporting(false);
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

  // Live credit totals mapped to UGC Broad Categories
  const broadCategoryMapping: Record<string, string> = {
    'PC': 'MCC', 'PE': 'MCC', 'BSC': 'MCC', 'BS': 'MCC',
    'ESC': 'MCC', 'ES': 'MCC', 'HSMC': 'MCC', 'HS': 'MCC',
    'OE': 'MSC/UEC', 'MSC': 'MSC/UEC', 'UEC': 'MSC/UEC'
  };

  const mapToBroadCategory = (cat: string) => broadCategoryMapping[cat?.toUpperCase()] || cat || 'MCC';

  const categoryCredits = courseVersions.reduce((acc, v) => {
    const broadCat = mapToBroadCategory(v.category || 'MCC');
    acc[broadCat] = (acc[broadCat] || 0) + (v.credits?.C || 0);
    return acc;
  }, {} as Record<string, number>);

  const grandTotalCredits = (Object.values(categoryCredits) as number[]).reduce((sum, v) => sum + v, 0);

  // Map DB Categories to the row format (strictly 9 rows as per UGC)
  const dynamicCategoryRows = dbCategories.map((cat: any) => ({
    code: cat.code,
    name: cat.name,
    ugc: cat.ugc || '-'
  }));

  const getRowCredits = (code: string) => {
    if (code === 'MSC/UEC') return (categoryCredits['MSC/UEC'] || 0) + (categoryCredits['MSC'] || 0) + (categoryCredits['UEC'] || 0);
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
  const fmtC = (val: number | null | undefined) => (val === 0 || !val) ? '-' : val;
  const getCourseCreditsText = (v: any) => `${fmtC(v.credits?.L)} ${fmtC(v.credits?.T)} ${fmtC(v.credits?.P)} ${fmtC(v.credits?.S)} ${fmtC(v.credits?.C)}`;
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
              <td>{fmtC(v.credits?.L)}</td>
              <td>{fmtC(v.credits?.T)}</td>
              <td>{fmtC(v.credits?.P)}</td>
              <td>{fmtC(v.credits?.S)}</td>
              <td>{fmtC(v.credits?.C)}</td>
              <td>{v.cieSee?.cieMaxMarks || 50}</td>
              <td>{v.cieSee?.seeMaxMarks || 50}</td>
              <td>{(v.cieSee?.cieMaxMarks || 50) + (v.cieSee?.seeMaxMarks || 50)}</td>
              <td>{v.prerequisites?.[0] || '-'}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td colSpan={3}>Total</td>
            <td>{fmtC(rows.reduce((sum, v) => sum + (v.credits?.L || 0), 0))}</td>
            <td>{fmtC(rows.reduce((sum, v) => sum + (v.credits?.T || 0), 0))}</td>
            <td>{fmtC(rows.reduce((sum, v) => sum + (v.credits?.P || 0), 0))}</td>
            <td>{fmtC(rows.reduce((sum, v) => sum + (v.credits?.S || 0), 0))}</td>
            <td>{fmtC(rows.reduce((sum, v) => sum + (v.credits?.C || 0), 0))}</td>
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
          <p className="text-xs text-slate-500 mt-1">Server-generated PDF (Puppeteer) and Word document from live curriculum data.</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Print Preview — browser native */}
          <button
            onClick={handlePrintPreview}
            id="curriculum-print-preview-btn"
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-sm"
            title="Open browser print dialog for quick preview"
          >
            <Printer className="w-4 h-4" />
            <span>Print Preview</span>
          </button>
          {/* DOCX Export */}
          <button
            onClick={handleExportDocx}
            disabled={docxExporting || !selectedRegulation || !selectedDepartment}
            id="curriculum-export-docx-btn"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {docxExporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <FileDown className="w-4 h-4" />}
            <span>{docxExporting ? 'Generating DOCX…' : 'Export DOCX'}</span>
          </button>
          {/* PDF Export */}
          <button
            onClick={handleExportPdf}
            disabled={pdfExporting || !selectedRegulation || !selectedDepartment}
            id="curriculum-export-pdf-btn"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfExporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
            <span>{pdfExporting ? 'Generating PDF…' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all animate-fade-in ${toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
            }`}
          id="curriculum-export-toast"
        >
          {toast.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
            : <XCircle className="w-5 h-5 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Main Preview Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-12 max-w-[900px] mx-auto print:p-0 print:border-0 print:shadow-none print-layout" id="curriculum-handbook-print-root">
        <PdfCoursePageStyles />
        {/* CODEx-added start: Program/regulation handbook header, footer, and watermark applied to printed preview. */}
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

        <div>
          <div>

            {/* ── PAGE 2: Department Frontmatter ── */}
            <PdfPage>
              <div className="pdf-frontmatter-header">
                <img src={adityaLogo} alt="Aditya University" className="pdf-frontmatter-logo" />
              </div>
              <div className="pdf-frontmatter">
                <h2>Department of {selectedDepartment?.name || 'Computer Science and Engineering'}</h2>
                <h3>{programDetails?.degree || 'B.Tech'} ({selectedDepartment?.code || 'CSE'}) Program Curriculum-{selectedRegulation?.academicYear || '2024'}</h3>
                <p style={{ textAlign: 'center' }}>(Applicable for the batches admitted from the A.Y. {selectedRegulation?.academicYear || '2024'}-{String((selectedRegulation?.academicYear || 2024) + 1).slice(-2)})</p>
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
                const lvl = (v.courseLevel || v.level || v.knowledgeLevel || '');
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
                        <tr><th colSpan={7} style={{ textAlign: 'center', fontWeight: 900, borderBottom: '2px solid #000' }}>{levelLabel}</th></tr>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Course Name</th>
                          <th>Category</th>
                          <th>L</th><th>T</th><th>P</th><th>S</th><th>C</th>
                        </tr>
                      </thead>
                      <tbody>
                        {levelRows.map((v: any) => (
                          <tr key={v._id}>
                            <td style={{ textAlign: 'left' }}>{v.courseId?.title || '-'}</td>
                            <td>{v.category || '-'}</td>
                            <td>{fmtC(v.credits?.L)}</td>
                            <td>{fmtC(v.credits?.T)}</td>
                            <td>{fmtC(v.credits?.P)}</td>
                            <td>{fmtC(v.credits?.S)}</td>
                            <td>{fmtC(v.credits?.C)}</td>
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
                <Xwrapper>
                  <div style={{ position: 'relative' }}>
                    {(['FC', 'IC', 'AC'] as const).map((levelKey) => {
                      const bgColor = levelKey === 'FC' ? '#d4edda' : levelKey === 'IC' ? '#f8d7da' : '#fff3cd';
                      const levelRows = courseVersions.filter((v: any) => {
                        if (['MSC', 'MSC/UEC', 'UEC'].includes(v.category)) return false;
                        const lvl = (v.courseLevel || v.level || v.knowledgeLevel || '');
                        if (levelKey === 'FC') return lvl.includes('FC') || lvl.toLowerCase().includes('foundation') || !lvl;
                        if (levelKey === 'IC') return lvl.includes('IC') || lvl.toLowerCase().includes('intermediate');
                        return lvl.includes('AC') || lvl.toLowerCase().includes('advanced');
                      });
                      return (
                        <div key={levelKey} className="pdf-prereq-level-row" style={{ background: bgColor }}>
                          <div className="pdf-prereq-level-label">{levelKey}</div>
                          <div className="pdf-prereq-courses-grid">
                            {levelRows.map((v: any) => (
                              <div key={v._id} id={`course-${v.courseId?._id}`} className="pdf-prereq-course-box">
                                {v.courseId?.keyword || v.courseId?.code || (v.courseId?.title || '').split(' ').map((w: string) => w[0]).join('').toUpperCase() || '-'}
                              </div>
                            ))}
                            {levelRows.length === 0 && <div className="pdf-prereq-course-box" style={{ opacity: 0.4 }}>—</div>}
                          </div>
                        </div>
                      );
                    })}
                    {prereqLinks.map(link => {
                      const startId = `course-${link.sourceCourseId?._id || link.sourceCourseId}`;
                      const endId = `course-${link.targetCourseId?._id || link.targetCourseId}`;
                      return (
                        <Xarrow
                          key={link._id}
                          start={startId}
                          end={endId}
                          color="#333"
                          strokeWidth={1.5}
                          path="grid"
                          headSize={4}
                          startAnchor="bottom"
                          endAnchor="top"
                          zIndex={10}
                        />
                      );
                    })}
                  </div>
                </Xwrapper>
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
                      .filter((v: any) => { const l = (v.level || v.knowledgeLevel || ''); return l.includes('FC') || l.toLowerCase().includes('foundation') || !l; })
                      .map((v: any) => v.courseId?.code
                        ? <p key={v._id} style={{ margin: '2px 0', fontSize: '13px' }}><strong>{v.courseId.keyword || v.courseId.code}</strong> - {v.courseId.title}</p>
                        : null)}
                  </div>
                  <div className="pdf-abbrev-col">
                    <p className="pdf-abbrev-level-title">Intermediate Level Courses:</p>
                    {courseVersions
                      .filter((v: any) => { const l = (v.level || v.knowledgeLevel || ''); return l.includes('IC') || l.toLowerCase().includes('intermediate'); })
                      .map((v: any) => v.courseId?.code
                        ? <p key={v._id} style={{ margin: '2px 0', fontSize: '13px' }}><strong>{v.courseId.keyword || v.courseId.code}</strong> - {v.courseId.title}</p>
                        : null)}
                  </div>
                </div>
                <div style={{ marginTop: '18px' }}>
                  <p className="pdf-abbrev-level-title">Advanced Level Courses:</p>
                  <div className="pdf-abbrev-columns">
                    {courseVersions
                      .filter((v: any) => { const l = (v.level || v.knowledgeLevel || ''); return l.includes('AC') || l.toLowerCase().includes('advanced'); })
                      .map((v: any) => v.courseId?.code
                        ? <p key={v._id} style={{ margin: '2px 0', fontSize: '13px' }}><strong>{v.courseId.keyword || v.courseId.code}</strong> - {v.courseId.title}</p>
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
                  <div className="pdf-prereq-flowchart-page" style={{ padding: '20px', fontFamily: 'Times New Roman' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                      <div style={{ backgroundColor: '#e2c027', padding: '15px 30px', borderRadius: '10px', display: 'inline-block', fontWeight: 'bold', fontSize: '16px' }}>
                        {programDetails?.name || 'B.Tech'} ({selectedDepartment?.code || 'CSE'}) Minor Stream<br /><br />Pre-requisite flowchart
                      </div>
                    </div>

                    {/* Minor Stream Headers with Arrows */}
                    <div style={{ display: 'flex', marginLeft: '50px', marginBottom: '10px' }}>
                      {minorStreams.map((stream: any) => (
                        <div key={stream._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ border: '1px solid #000', backgroundColor: '#fff', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>
                            {stream.keyword || stream.name.split(' ').map((w: string) => w[0]).join('')}
                          </div>
                          <div style={{ height: '20px', width: '1px', backgroundColor: '#000', position: 'relative' }}>
                            <div style={{ position: 'absolute', bottom: '-4px', left: '-3px', width: '0', height: '0', borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderTop: '4px solid #000' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Flowchart Levels */}
                    {(['FC', 'IC', 'AC'] as const).map((levelKey) => {
                      const bgColor = levelKey === 'FC' ? '#fdeca6' : levelKey === 'IC' ? '#f4a5a5' : '#e6a8d7';
                      const circleColor = levelKey === 'FC' ? '#e2c027' : levelKey === 'IC' ? '#d4df32' : '#e2c027';
                      const courseBgColor = levelKey === 'FC' ? '#ffcc80' : levelKey === 'IC' ? '#ffcdd2' : '#f8bbd0';

                      return (
                        <div key={levelKey} style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: circleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', marginRight: '10px' }}>
                            {levelKey}
                          </div>
                          <div style={{ flex: 1, backgroundColor: bgColor, borderRadius: '15px', padding: '15px 0', display: 'flex', minHeight: '100px' }}>
                            {minorStreams.map((stream: any) => {
                              const courses = stream.courses || [];
                              const levelCourses = courses.filter((c: any) => {
                                const v = courseVersions.find((ver: any) => ver.courseId === c._id || ver.courseId?._id === c._id);
                                const lvl = (v?.courseLevel || c.level || c.courseLevel || '');
                                if (levelKey === 'FC') return lvl.includes('FC') || lvl.toLowerCase().includes('foundation') || (!lvl);
                                if (levelKey === 'IC') return lvl.includes('IC') || lvl.toLowerCase().includes('intermediate');
                                return lvl.includes('AC') || lvl.toLowerCase().includes('advanced');
                              });

                              return (
                                <div key={stream._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                  {levelCourses.map((c: any) => (
                                    <div key={c._id} style={{ backgroundColor: courseBgColor, padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', border: '1px solid rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '90%' }}>
                                      {c.keyword || c.code}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
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
                  <table className="pdf-grid-table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '25%', textAlign: 'left' }}>Minor Stream</th>
                        <th style={{ width: '25%', textDecoration: 'underline', textAlign: 'left' }}>FC - Foundation Course</th>
                        <th style={{ width: '25%', textDecoration: 'underline', textAlign: 'left' }}>IC - Intermediate-Level Course</th>
                        <th style={{ width: '25%', textDecoration: 'underline', textAlign: 'left' }}>AC - Advanced Course</th>
                      </tr>
                    </thead>
                    <tbody>
                      {minorStreams.map((stream: any) => {
                        const courses: any[] = stream.courses || [];
                        const getLevel = (c: any) => {
                          const v = courseVersions.find((ver: any) => ver.courseId === c._id || ver.courseId?._id === c._id);
                          return (v?.courseLevel || c.level || c.courseLevel || '');
                        };
                        const fc = courses.filter((c: any) => {
                          const lvl = getLevel(c);
                          return lvl.includes('FC') || lvl.toLowerCase().includes('foundation') || (!lvl);
                        });
                        const ic = courses.filter((c: any) => {
                          const lvl = getLevel(c);
                          return lvl.includes('IC') || lvl.toLowerCase().includes('intermediate');
                        });
                        const ac = courses.filter((c: any) => {
                          const lvl = getLevel(c);
                          return lvl.includes('AC') || lvl.toLowerCase().includes('advanced');
                        });

                        return (
                          <tr key={stream._id}>
                            <td style={{ textAlign: 'left', fontWeight: 700, verticalAlign: 'top', paddingTop: '6px' }}>
                              {stream.keyword ? `${stream.keyword}: ${stream.name}` : stream.name}
                            </td>
                            <td style={{ textAlign: 'left', fontSize: '11px', verticalAlign: 'top' }}>
                              {fc.map((c: any) => <div key={c._id} style={{ marginBottom: '4px' }}><strong>{c.keyword || c.code}:</strong> {c.title}</div>)}
                            </td>
                            <td style={{ textAlign: 'left', fontSize: '11px', verticalAlign: 'top' }}>
                              {ic.map((c: any) => <div key={c._id} style={{ marginBottom: '4px' }}><strong>{c.keyword || c.code}:</strong> {c.title}</div>)}
                            </td>
                            <td style={{ textAlign: 'left', fontSize: '11px', verticalAlign: 'top' }}>
                              {ac.map((c: any) => <div key={c._id} style={{ marginBottom: '4px' }}><strong>{c.keyword || c.code}:</strong> {c.title}</div>)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </PdfPage>
                <div className="page-break"></div>
              </>
            )}

            {/* MINOR DEGREE FLOWCHART */}
            {Object.keys(publishedMinorDegrees).length > 0 && (
              <PdfPage>
                <div className="pdf-prereq-flowchart-page" style={{ padding: '20px', fontFamily: 'Times New Roman' }}>
                  <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ backgroundColor: '#95b3d7', padding: '15px 30px', display: 'inline-block', fontWeight: 'bold', fontSize: '16px', border: '1px solid #000' }}>
                      Minor Degree<br />Pre-requisite Flow Chart
                    </div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', marginLeft: '50px', marginBottom: '10px' }}>
                      {Object.values(publishedMinorDegrees).flat().map((minor: any, idx) => {
                        const colors = ['#f47c36', '#4a7ebb', '#7ab5e1', '#77ab59', '#e36c09', '#fcd5b4', '#a6a6a6', '#c4d79b', '#ffc000', '#f79646', '#9bbb59'];
                        const color = colors[idx % colors.length];
                        const shortName = minor.departmentName ? minor.departmentName.split(' ').map((w: string) => w[0]).join('') : minor.minorName.split(' ').map((w: string) => w[0]).join('');
                        return (
                          <div key={minor._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ backgroundColor: color, color: '#fff', border: '1px solid #000', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', minWidth: '40px', textAlign: 'center', marginBottom: '10px' }}>
                              {shortName}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {(['FC', 'IC', 'AC'] as const).map((levelKey) => {
                      const bgColor = levelKey === 'FC' ? '#eaeff7' : levelKey === 'IC' ? '#b8cce4' : '#fef2cb';
                      const labelColor = levelKey === 'FC' ? '#4a7ebb' : levelKey === 'IC' ? '#95b3d7' : '#e36c09';

                      return (
                        <div key={levelKey} style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                          <div style={{ width: '40px', height: '30px', borderRadius: '4px', backgroundColor: labelColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', marginRight: '10px', border: '1px solid #000' }}>
                            {levelKey}
                          </div>
                          <div style={{ flex: 1, backgroundColor: bgColor, borderRadius: '20px', border: '1px solid #000', padding: '15px 0', minHeight: '80px', display: 'flex' }}>
                            {Object.values(publishedMinorDegrees).flat().map((minor: any, mIdx) => {
                              const courses = minor.courses || [];
                              const levelCourses = courses.filter((c: any) => {
                                const v = courseVersions.find((ver: any) => ver.courseId?.code === c.courseCode);
                                const cLvl = (v?.courseLevel || v?.level || c.level || 'IC').toUpperCase();
                                return cLvl.includes(levelKey) || (levelKey === 'FC' && cLvl.includes('FOUNDATION')) || (levelKey === 'IC' && cLvl.includes('INTERMEDIATE')) || (levelKey === 'AC' && cLvl.includes('ADVANCED'));
                              });

                              const colors = ['#f47c36', '#4a7ebb', '#7ab5e1', '#77ab59', '#e36c09', '#fcd5b4', '#a6a6a6', '#c4d79b', '#ffc000', '#f79646', '#9bbb59'];
                              const color = colors[mIdx % colors.length];

                              return (
                                <div key={minor._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                  {levelCourses.map((c: any) => (
                                    <div key={c._id} style={{ backgroundColor: color, color: '#fff', border: '1px solid #000', padding: '4px', fontSize: '10px', fontWeight: 'bold', width: '80%', textAlign: 'center', borderRadius: '2px', wordWrap: 'break-word' }}>
                                      {c.courseCode}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PdfPage>
            )}
            {Object.keys(publishedMinorDegrees).length > 0 && <div className="page-break"></div>}

            {/* MINOR DEGREES TAB */}
            {Object.keys(publishedMinorDegrees).length > 0 && (
              <PdfPage>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h2 style={{ color: '#0f172a', margin: 0, fontSize: '20px' }}>Available Minor Degree Offerings</h2>
                  <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>(Cross-Departmental)</p>
                </div>
                {Object.keys(publishedMinorDegrees).map(deptName => (
                  <div key={deptName} style={{ marginBottom: '30px' }}>
                    <h3 style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', color: '#334155', fontSize: '16px', marginBottom: '16px' }}>{deptName}</h3>
                    {publishedMinorDegrees[deptName].map((minor: any) => {
                      let sumL = 0, sumT = 0, sumP = 0, sumC = 0;
                      const groupSizes: Record<string, number> = {};
                      (minor.courses || []).forEach((c: any) => {
                        if (c.orGroupId) groupSizes[c.orGroupId] = (groupSizes[c.orGroupId] || 0) + 1;
                      });
                      const renderedGroups = new Set<string>();
                      const groupCounters: Record<string, number> = {};

                      return (
                        <div key={minor._id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            <h4 style={{ color: '#000', fontSize: '14px', margin: '0 0 5px 0', fontWeight: 'bold' }}>Minor Degree in {minor.minorName}</h4>
                            <p style={{ color: '#000', fontSize: '12px', margin: 0 }}>(offered to other branches students)</p>
                            <p style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                              * To acquire a minor degree, a student has to earn {minor.requiredCredits} credits in addition to the 160 credits.
                              {minor.eligibility && ` | Eligibility: ${minor.eligibility}`}
                            </p>
                          </div>

                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center', border: '1px solid #000' }}>
                            <thead>
                                <tr>
                                  <th style={{ border: '1px solid #000', padding: '4px' }}>Course Code</th>
                                  <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Course Name</th>
                                  <th style={{ border: '1px solid #000', padding: '4px' }}>Category</th>
                                  <th style={{ border: '1px solid #000', padding: '4px' }}>Level</th>
                                  <th style={{ border: '1px solid #000', padding: '4px' }}>L</th>
                                  <th style={{ border: '1px solid #000', padding: '4px' }}>T</th>
                                  <th style={{ border: '1px solid #000', padding: '4px' }}>P</th>
                                  <th style={{ border: '1px solid #000', padding: '4px' }}>C</th>
                                  <th style={{ border: '1px solid #000', padding: '4px' }}>CIE</th>
                                  <th style={{ border: '1px solid #000', padding: '4px' }}>SEE</th>
                                  <th style={{ border: '1px solid #000', padding: '4px' }}>Total</th>
                                  <th style={{ border: '1px solid #000', padding: '4px' }}>Pre-requisite</th>
                                </tr>
                              </thead>
                            <tbody>
                              {(minor.courses || []).map((c: any) => {
                                const v = courseVersions.find(ver => ver.courseId?.code === c.courseCode);
                                const category = v?.category || c.category || '-';
                                const level = v?.courseLevel || v?.level || c.level || 'IC';
                                const L = v?.credits?.L || 0;
                                const T = v?.credits?.T || 0;
                                const P = v?.credits?.P || 0;
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

                                if (!skipMergedColumns) {
                                  sumL += L; sumT += T; sumP += P; sumC += C;
                                }

                                const prereqs = v ? prereqLinks.filter(l => String(l.targetCourseId?._id || l.targetCourseId) === String(v.courseId?._id)) : [];
                                const prereqStr = prereqs.length > 0
                                  ? prereqs.map(l => l.sourceCourseId?.keyword || l.sourceCourseId?.code || '').filter(Boolean).join(', ')
                                  : '-';

                                return (
                                  <tr key={c._id}>
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>{c.courseCode}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>
                                      {c.courseName}{appendOr && <> (or)</>}
                                    </td>
                                    {!skipMergedColumns && <td rowSpan={groupSize} style={{ border: '1px solid #000', padding: '4px' }}>{category}</td>}
                                    {!skipMergedColumns && <td rowSpan={groupSize} style={{ border: '1px solid #000', padding: '4px' }}>{level}</td>}
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>{L || ''}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>{T || ''}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>{P || ''}</td>
                                    {!skipMergedColumns && <td rowSpan={groupSize} style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>{C}</td>}
                                    {!skipMergedColumns && <td rowSpan={groupSize} style={{ border: '1px solid #000', padding: '4px' }}>{CIE}</td>}
                                    {!skipMergedColumns && <td rowSpan={groupSize} style={{ border: '1px solid #000', padding: '4px' }}>{SEE}</td>}
                                    {!skipMergedColumns && <td rowSpan={groupSize} style={{ border: '1px solid #000', padding: '4px' }}>{total}</td>}
                                    {!skipMergedColumns && <td rowSpan={groupSize} style={{ border: '1px solid #000', padding: '4px' }}>{prereqStr}</td>}
                                  </tr>
                                );
                              })}
                              <tr>
                                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }} colSpan={4}>Total</td>
                                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>{sumL}</td>
                                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>{sumT}</td>
                                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>{sumP}</td>
                                <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>{sumC}</td>
                                <td style={{ border: '1px solid #000', padding: '4px' }} colSpan={4}></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </PdfPage>
            )}
            {Object.keys(publishedMinorDegrees).length > 0 && <div className="page-break"></div>}

            {/* ── Category-wise Course Tables ── */}
            <PdfPage>
              {dynamicCategoryRows.length > 0 ? (
                dynamicCategoryRows.map((cat: any) => {
                  const rows = courseVersions.filter((v: any) => {
                    const broadCat = mapToBroadCategory(v.category || 'MCC');
                    if (cat.code === 'MSC/UEC') return broadCat === 'MSC/UEC' || broadCat === 'MSC' || broadCat === 'UEC';
                    return broadCat === cat.code;
                  });
                  if (rows.length === 0) return null;
                  return renderPdfCourseTable(cat.name, rows);
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No Categories configured. Please add course categories.
                </div>
              )}
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
        </div>
      </div>

      {/* Global CSS style injecting print definitions print layout */}
      <style>{`
        /* CODEx-added start: Reference-PDF visual system for the generated curriculum book. */
        #curriculum-handbook-print-root {
          background: #f8fafc;
        }
        .pdf-cover-page {
          height: 240mm; /* Exact fit for A4 print */
          background: #fff;
          position: relative;
          z-index: 1000; /* Cover up the fixed print-headers on page 1 */
          padding: 10mm 15mm;
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
          margin: 0 0 40px;
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
            background: #fff !important;
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

          .print-body {
            padding-top: 5mm; /* Header space */
          }
          /* CODEx-added start: Print-only header, footer, and watermark for curriculum books. */
          /* CODEx-added end */
        }
        /* CODEx-added start: On-screen watermark preview for curriculum book layout review. */
        /* CODEx-added end */
      `}</style>
    </div>
  );
};

export default CurriculumBookGenerator;
