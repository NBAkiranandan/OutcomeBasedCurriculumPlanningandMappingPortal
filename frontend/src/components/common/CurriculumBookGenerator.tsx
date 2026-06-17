import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useContextStore } from '../../store/contextStore';
import { 
  FileText, Download, Printer, BookOpen, Layers, Award, Sparkles, 
  HelpCircle, ChevronRight, Activity, ArrowRight, Grid3X3, Database
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';

export const CurriculumBookGenerator: React.FC = () => {
  const { selectedProgram, selectedDepartment, selectedRegulation } = useContextStore();
  const [loading, setLoading] = useState(false);
  const [peoPso, setPeoPso] = useState<any>({ peos: [], psos: [], pos: [] });
  const [courseVersions, setCourseVersions] = useState<any[]>([]);
  const [prereqLinks, setPrereqLinks] = useState<any[]>([]);
  const [minorStreams, setMinorStreams] = useState<any[]>([]);
  
  // Loaded context data
  const [programDetails, setProgramDetails] = useState<any>(null);

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
                    text: `${selectedProgram?.name || 'B.Tech'} - ${selectedDepartment.name}`,
                    bold: true,
                    size: 32,
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
  const categories = ['MCC', 'MDC', 'AEC', 'SEC', 'VAC', 'MSC', 'UEC', 'MC', 'SI', 'PROJ'];
  const categoryCredits = categories.reduce((acc, cat) => {
    acc[cat] = courseVersions
      .filter(v => v.category === cat)
      .reduce((sum, v) => sum + (v.credits?.C || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const grandTotalCredits = Object.values(categoryCredits).reduce((sum, v) => sum + v, 0);

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
        
        {/* SECTION 1: COVER PAGE */}
        <div className="flex flex-col items-center justify-between min-h-[950px] border-4 border-double border-slate-800 p-12 text-center relative print:border-slate-800 print:min-h-screen">
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-widest font-serif">Academic Curriculum & Syllabus Book</h4>
            <div className="w-16 h-1 bg-slate-800 mx-auto mt-2"></div>
          </div>

          <div className="space-y-4 my-10">
            <h1 className="text-3xl font-black text-slate-900 leading-tight uppercase font-serif">
              {programDetails?.degree || 'B.Tech'} IN {selectedDepartment?.name}
            </h1>
            <p className="text-base text-slate-600 font-medium tracking-wide uppercase">
              Regulation context: <span className="font-mono font-bold text-blue-600">{selectedRegulation?.code}</span>
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex justify-center">
              {/* Aditya University Placeholder logo */}
              <div className="w-24 h-24 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold font-serif text-3xl shadow-md">
                AU
              </div>
            </div>
            <div>
              <h3 className="text-md font-bold text-slate-800 font-serif uppercase tracking-wider">Aditya University</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-1">Accredited by NAAC with 'A++' Grade · Approved by AICTE</p>
            </div>
          </div>
        </div>

        {/* Page Break */}
        <div className="page-break"></div>

        {/* SECTION 2: PROGRAM INFORMATION */}
        <div className="py-10 space-y-8 print:py-6">
          <div className="border-b-2 border-slate-800 pb-2">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800 font-serif">1. Program Overview</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="block text-[10px] uppercase text-slate-400 font-bold">Academic Degree</span>
              <strong className="text-slate-800 text-sm mt-1 block">{programDetails?.degree || 'Bachelor of Technology'}</strong>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="block text-[10px] uppercase text-slate-400 font-bold">Total Credits Requirement</span>
              <strong className="text-slate-800 text-sm mt-1 block">{programDetails?.totalCredits || 160} Credits</strong>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Vision</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-3 rounded-lg border border-slate-200/50">
              {programDetails?.vision || 'To provide high-quality engineering education that prepares students for globally competitive careers and lifelong learning.'}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Mission</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-3 rounded-lg border border-slate-200/50 whitespace-pre-line">
              {programDetails?.mission || 'M1: Offer state-of-the-art laboratory and academic resources.\nM2: Industry-collaborated curriculum frameworks for industry readiness.'}
            </p>
          </div>
        </div>

        <div className="page-break"></div>

        {/* SECTION 3: CREDIT DISTRIBUTION */}
        <div className="py-10 space-y-6 print:py-6">
          <div className="border-b-2 border-slate-800 pb-2">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800 font-serif">2. Category-Wise Credit Distribution</h2>
          </div>
          <p className="text-xs text-slate-600">The total graduation requirements are structured across {categories.length} distinct outcome categories mapping to AICTE guidelines.</p>

          <table className="w-full text-left border-collapse text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase">
                <th className="p-3 pl-4 border-r border-slate-300">Category Code</th>
                <th className="p-3 border-r border-slate-300">Category Name</th>
                <th className="p-3 text-right pr-4">Total Credits</th>
              </tr>
            </thead>
            <tbody>
              {[
                { code: 'MCC', name: 'Major Core Courses' },
                { code: 'MDC', name: 'Multi-Disciplinary Courses' },
                { code: 'AEC', name: 'Ability Enhancement Courses' },
                { code: 'SEC', name: 'Skill Enhancement Courses' },
                { code: 'VAC', name: 'Value Added Courses' },
                { code: 'MSC', name: 'Minor Stream Courses' },
                { code: 'UEC', name: 'University Open Electives' },
                { code: 'MC', name: 'Mandatory Courses' },
                { code: 'SI', name: 'Summer Internships' },
                { code: 'PROJ', name: 'Project Works' }
              ].map((cat) => (
                <tr key={cat.code} className="border-b border-slate-200 text-slate-650 font-medium">
                  <td className="p-3 pl-4 border-r border-slate-300 font-bold font-mono text-blue-600">{cat.code}</td>
                  <td className="p-3 border-r border-slate-300 font-semibold">{cat.name}</td>
                  <td className="p-3 text-right pr-4 font-bold text-slate-800">{categoryCredits[cat.code] || 0}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-350">
                <td colSpan={2} className="p-3 pl-4 border-r border-slate-300 uppercase text-right">Grand Total credits</td>
                <td className="p-3 text-right pr-4 text-blue-700 font-black">{grandTotalCredits}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="page-break"></div>

        {/* SECTION 4 - 13: SEMESTER-WISE BREAKDOWN TABLES */}
        <div className="py-10 space-y-8 print:py-6">
          <div className="border-b-2 border-slate-800 pb-2">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800 font-serif">3. Regulation Course Mappings</h2>
          </div>

          {Array.from({ length: 8 }).map((_, semIdx) => {
            const semNum = semIdx + 1;
            const semCourses = courseVersions.filter(v => v.semester === semNum);
            
            if (semCourses.length === 0) return null;

            return (
              <div key={semNum} className="space-y-3 pb-6 border-b border-slate-100 last:border-0 print:break-inside-avoid">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-4.5 h-4.5 text-blue-600" />
                  <span>Semester {semNum}</span>
                </h3>
                <table className="w-full text-left border-collapse text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-55 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                      <th className="p-2.5 pl-3 border-r border-slate-200">Course Code</th>
                      <th className="p-2.5 border-r border-slate-200">Title</th>
                      <th className="p-2.5 border-r border-slate-200">Category</th>
                      <th className="p-2.5 text-center border-r border-slate-200">L - T - P - S</th>
                      <th className="p-2.5 text-right pr-3">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semCourses.map(v => (
                      <tr key={v._id} className="border-b border-slate-100 hover:bg-slate-50/20 text-slate-650 font-medium">
                        <td className="p-2.5 pl-3 border-r border-slate-200 font-mono font-bold text-blue-600">{v.courseId?.code}</td>
                        <td className="p-2.5 border-r border-slate-200 font-semibold text-slate-800">{v.courseId?.title}</td>
                        <td className="p-2.5 border-r border-slate-200 font-bold">{v.category}</td>
                        <td className="p-2.5 text-center border-r border-slate-200 font-mono text-[11px] font-semibold">{v.credits?.L || 3} - {v.credits?.T || 0} - {v.credits?.P || 0} - {v.credits?.S || 0}</td>
                        <td className="p-2.5 text-right pr-3 font-bold text-slate-800">{v.credits?.C || 3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <div className="page-break"></div>

        {/* SECTION 12: MINOR STREAMS */}
        {minorStreams.length > 0 && (
          <div className="py-10 space-y-6 print:py-6">
            <div className="border-b-2 border-slate-800 pb-2">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800 font-serif">4. Minor Streams Mapping</h2>
            </div>
            {minorStreams.map(stream => (
              <div key={stream._id} className="space-y-3 border border-slate-200 p-4 rounded-xl print:break-inside-avoid">
                <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Stream: {stream.name}</span>
                </h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase">
                      <th className="p-2 pl-3">Course Code</th>
                      <th className="p-2">Course Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stream.courses.map((c: any) => (
                      <tr key={c._id} className="border-b border-slate-100 font-semibold text-slate-700">
                        <td className="p-2 pl-3 font-mono text-blue-600">{c.code}</td>
                        <td>{c.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        <div className="page-break"></div>

        {/* SECTION 17: PREREQUISITE GRAPH FLOWCHARTS */}
        {prereqLinks.length > 0 && (
          <div className="py-10 space-y-6 print:py-6">
            <div className="border-b-2 border-slate-800 pb-2">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800 font-serif">5. Prerequisite Flowcharts Hierarchy</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">Below is the sequence graph mapping of prerequisite courses in the R24 regulation context.</p>
            
            <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50 space-y-3">
              {prereqLinks.map(link => (
                <div key={link._id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm w-max print:break-inside-avoid">
                  <span className="font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">{link.sourceCourseId?.code}</span>
                  <span className="text-slate-500 font-bold">{link.sourceCourseId?.title}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">{link.targetCourseId?.code}</span>
                  <span className="text-slate-500 font-bold">{link.targetCourseId?.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="page-break"></div>

        {/* SECTION 18: DETAILED COURSE SYLLABUS LISTING */}
        <div className="py-10 space-y-8 print:py-6">
          <div className="border-b-2 border-slate-800 pb-2">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800 font-serif">6. Detailed Course Syllabus & Outlines</h2>
          </div>

          {courseVersions.map((v, cIdx) => (
            <div key={v._id} className="space-y-6 pt-6 pb-8 border-b border-slate-300 last:border-0 print:break-inside-avoid">
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] font-mono text-blue-600 font-bold uppercase bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">Course {cIdx + 1}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1 uppercase font-serif">{v.courseId?.code} - {v.courseId?.title}</h3>
                </div>
                <div className="text-right text-xs font-mono font-bold text-slate-700 bg-slate-100 p-2 rounded border border-slate-200">
                  <div>L-T-P-S: {v.credits?.L || 3}-{v.credits?.T || 0}-{v.credits?.P || 0}-{v.credits?.S || 0}</div>
                  <div>Credits: {v.credits?.C || 3}</div>
                </div>
              </div>

              {/* Objectives */}
              {v.objectives?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Course Objectives</h4>
                  <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1 font-semibold leading-relaxed">
                    {v.objectives.map((obj: string, i: number) => <li key={i}>{obj}</li>)}
                  </ul>
                </div>
              )}

              {/* Course Outcomes */}
              {v.courseOutcomes?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Course Outcomes (COs)</h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-[11px] font-medium text-slate-600">
                      <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-extrabold">
                        <tr>
                          <th className="px-3 py-2 border-b border-slate-200 w-16">CO Code</th>
                          <th className="px-3 py-2 border-b border-slate-200">Description</th>
                          <th className="px-3 py-2 border-b border-slate-200 w-32">Bloom's Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {v.courseOutcomes.map((co: any) => (
                          <tr key={co.coCode} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono font-bold text-slate-800">{co.coCode}</td>
                            <td className="px-3 py-2 leading-relaxed">{co.description || '-'}</td>
                            <td className="px-3 py-2 text-slate-500 font-bold">{co.bloomLevel || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CO-PO Mapping */}
              {v.coPoMappings?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">CO-PO Mapping Matrix</h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-center text-[11px] font-medium text-slate-600">
                      <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-extrabold">
                        <tr>
                          <th className="px-3 py-2 border-b border-slate-200 border-r w-16 text-left">CO \ PO</th>
                          {[...Array(12)].map((_, i) => (
                            <th key={`po-${i+1}`} className="px-2 py-2 border-b border-slate-200">PO{i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {v.courseOutcomes?.map((co: any) => {
                          const mapping = v.coPoMappings?.find((m: any) => m.coCode === co.coCode) || { po: {} };
                          return (
                            <tr key={co.coCode} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                              <td className="px-3 py-2 border-r border-slate-100 font-mono font-bold text-slate-800 text-left">{co.coCode}</td>
                              {[...Array(12)].map((_, i) => {
                                const val = mapping.po[`PO${i + 1}`] || 0;
                                return (
                                  <td key={`val-${i}`} className={`px-2 py-2 ${val > 0 ? 'text-blue-700 font-bold' : 'text-slate-300'}`}>
                                    {val || '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CO-PSO Mapping */}
              {v.coPsoMappings?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">CO-PSO Mapping Matrix</h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-center text-[11px] font-medium text-slate-600">
                      <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-extrabold">
                        <tr>
                          <th className="px-3 py-2 border-b border-slate-200 border-r w-16 text-left">CO \ PSO</th>
                          {[...Array(3)].map((_, i) => (
                            <th key={`pso-${i+1}`} className="px-2 py-2 border-b border-slate-200">PSO{i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {v.courseOutcomes?.map((co: any) => {
                          const mapping = v.coPsoMappings?.find((m: any) => m.coCode === co.coCode) || { pso: {} };
                          return (
                            <tr key={co.coCode} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                              <td className="px-3 py-2 border-r border-slate-100 font-mono font-bold text-slate-800 text-left">{co.coCode}</td>
                              {[...Array(3)].map((_, i) => {
                                const val = mapping.pso[`PSO${i + 1}`] || 0;
                                return (
                                  <td key={`val-${i}`} className={`px-2 py-2 ${val > 0 ? 'text-teal-700 font-bold' : 'text-slate-300'}`}>
                                    {val || '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Syllabus Units */}
              {v.syllabusUnits?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Syllabus Units Details</h4>
                  <div className="space-y-3">
                    {v.syllabusUnits.map((unit: any) => (
                      <div key={unit.unitNumber} className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 space-y-1.5">
                        <strong className="block text-xs font-bold text-slate-800 uppercase tracking-wide">Unit {unit.unitNumber}: {unit.title} ({unit.hours || 10} Hours)</strong>
                        <p className="text-[11px] text-slate-650 font-medium leading-relaxed">{unit.topics?.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Textbooks & References */}
              <div className="grid grid-cols-2 gap-4">
                {v.textbooks?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Text Books</h4>
                    <ul className="list-decimal pl-4 text-[11px] text-slate-600 space-y-1 font-semibold leading-relaxed">
                      {v.textbooks.map((tb: any, i: number) => (
                        <li key={i}>
                          {typeof tb === 'string' ? tb : `${tb.title}${tb.author ? ' by ' + tb.author : ''}${tb.publisher || tb.edition ? ' (' + [tb.publisher, tb.edition].filter(Boolean).join(', ') + ')' : ''}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {v.referenceMaterials?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Reference Materials</h4>
                    <ul className="list-decimal pl-4 text-[11px] text-slate-600 space-y-1 font-semibold leading-relaxed">
                      {v.referenceMaterials.map((ref: any, i: number) => (
                        <li key={i}>
                          {typeof ref === 'string' ? ref : `${ref.title}${ref.author ? ' by ' + ref.author : ''}${ref.publisher || ref.edition ? ' (' + [ref.publisher, ref.edition].filter(Boolean).join(', ') + ')' : ''}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {v.onlineResources?.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Web Links / Online Resources</h4>
                  <ul className="list-disc pl-5 text-[11px] text-slate-600 space-y-1 font-semibold leading-relaxed">
                    {v.onlineResources.map((res: any, i: number) => (
                      <li key={i}>
                        {typeof res === 'string' ? res : (res.description ? `${res.url} - ${res.description}` : res.url)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Assessment Scheme */}
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Assessment Scheme</h4>
                <div className="grid grid-cols-3 gap-3 text-[11px] font-semibold text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>CIE Max Marks: <strong className="text-slate-800">{v.cieSee?.cieMaxMarks || 40}</strong></div>
                  <div>SEE Max Marks: <strong className="text-slate-800">{v.cieSee?.seeMaxMarks || 60}</strong></div>
                  <div>Total Marks: <strong className="text-slate-800">100</strong></div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Global CSS style injecting print definitions print layout */}
      <style>{`
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
        }
      `}</style>
    </div>
  );
};

export default CurriculumBookGenerator;
