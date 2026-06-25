import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useContextStore } from '../../store/contextStore';
import { api } from '../../services/api';
import { 
  LayoutDashboard, BookOpen, FileText, Bell, Settings, 
  Search, ShieldAlert, Award, ArrowRight, ArrowLeft, CheckCircle2, ChevronRight,
  Info, ExternalLink, Calendar, User, Briefcase, Mail, Cpu, Building2, Phone, AlertCircle, X,
  Filter, Eye
} from 'lucide-react';
import { CurriculumBookGenerator } from '../../components/common/CurriculumBookGenerator';
import { PdfCoursePage, PdfCoursePageStyles } from '../../components/common/PdfCoursePage';

interface FacultyDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuthStore();

  const getInitials = () => {
    if (!user?.name) return 'FA';
    return user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getDepartmentName = () => {
    return user?.department?.name || 'Computer Science and Engineering';
  };

  const getDepartmentCode = () => {
    return user?.department?.code || 'CSE';
  };

  const getRoleLabel = () => {
    if (user?.role === 'Faculty') return 'Faculty Member';
    return user?.role || 'Faculty';
  };

  // State for approved courses
  const [approvedCourses, setApprovedCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCourseCode, setSelectedCourseCode] = useState('');
  const [showAllCourses, setShowAllCourses] = useState(false);
  
  const [dbPeos, setDbPeos] = useState<any[]>([]);
  const [dbPsos, setDbPsos] = useState<any[]>([]);
  const [dbPos, setDbPos] = useState<any[]>([]);
  const [publishedBookReviews, setPublishedBookReviews] = useState<any[]>([]);

  // Profile update success state
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);
  const { profileSuccess, setChangePasswordModalOpen } = useUIStore();

  // Profile preferences toggles state
  const [emailNotif, setEmailNotif] = useState(true);
  const [erpUpdates, setErpUpdates] = useState(true);
  const [announcementAlerts, setAnnouncementAlerts] = useState(false);

  // Selected Course for View Courses tab
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [bookViewMode, setBookViewMode] = useState<'directory' | 'view'>('directory');
  const [previewCourse, setPreviewCourse] = useState<any>(null);

  // Dynamic finalized curriculum count
  const [finalizedCount, setFinalizedCount] = useState(0);
  const { departments, regulations, selectedDepartment, selectedRegulation, setSelectedRegulation, setSelectedDepartment } = useContextStore();

  useEffect(() => {
    if (user?.department && !selectedDepartment) {
      setSelectedDepartment(user.department as any);
    }
  }, [user, selectedDepartment, setSelectedDepartment]);

  useEffect(() => {
    const fetchCoursesAndOutcomes = async () => {
      if (!selectedRegulation?._id) return;
      setIsLoading(true);
      try {
        // Fetch faculty-specific assigned courses
        const res = await api.courseAssignments.listMyCourses();
        const allAssignedVersions = res.versions || [];
        
        // Filter by the currently selected regulation
        const regVersions = allAssignedVersions.filter((v: any) => 
          v.regulationId?._id === selectedRegulation._id || v.regulationId === selectedRegulation._id
        );
        
        // Faculty should see assigned courses
        setApprovedCourses(regVersions);
        setFinalizedCount(regVersions.length);
        
        if (regVersions.length > 0 && (!selectedCourseId || !regVersions.some((v: any) => v._id === selectedCourseId))) {
          setSelectedCourseId(regVersions[0]._id);
          setSelectedCourseCode(regVersions[0].courseId?.code);
        }

        // Fetch regulation-scoped PEOs, PSOs and POs from the same source HOD edits.
        if (selectedDepartment?._id) {
          const peoPsoRes = await api.peoPso.getByDept(selectedDepartment._id, selectedRegulation._id);
          setDbPeos(peoPsoRes.peoPso?.peos || []);
          setDbPsos(peoPsoRes.peoPso?.psos || []);
          setDbPos(peoPsoRes.peoPso?.pos || []);
        }
      } catch (err) {
        console.error('[Faculty] Failed to fetch data:', err);
        setApprovedCourses([]);
        setFinalizedCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoursesAndOutcomes();
  }, [selectedRegulation, selectedDepartment]);

  // Load published books from backend directly for proper db connectivity
  useEffect(() => {
    const loadPublishedBooks = async () => {
      if (!selectedDepartment?._id) return;
      try {
        console.log('[DEBUG] Fetching published books for departmentId:', selectedDepartment._id);
        const res = await api.curriculumBooks.reviews({ departmentId: selectedDepartment._id, status: 'Published' });
        console.log('[DEBUG] Fetched published books response:', res);
        setPublishedBookReviews(res.reviews || []);
      } catch (err) {
        console.error('[Faculty] Failed to load published curriculum books:', err);
        setPublishedBookReviews([]);
      }
    };
    loadPublishedBooks();
  }, [selectedDepartment]);

  // Dropdown states for filters
  const [deptFilter, setDeptFilter] = useState('All');
  const [semFilter, setSemFilter] = useState('All');
  const [regFilter, setRegFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Notifications Category filter state
  const [activeNotifTab, setActiveNotifTab] = useState<'All' | 'Updates' | 'Announcements' | 'System'>('All');

  // Recent activity list state with empty state fallbacks
  const [recentActivities] = useState<any[]>([
    { action: 'Viewed syllabus', course: 'CS3301', time: '2 hours ago' },
    { action: 'Opened course file', course: 'CS3301', time: 'Yesterday' }
  ]);

  // Static descriptions matching PO1-PO12
  const programOutcomes = [
    { code: 'PO1', title: 'Engineering Knowledge', desc: 'Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems.' },
    { code: 'PO2', title: 'Problem Analysis', desc: 'Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.' },
    { code: 'PO3', title: 'Design/Development of Solutions', desc: 'Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.' },
    { code: 'PO4', title: 'Conduct Investigations of Complex Problems', desc: 'Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.' },
    { code: 'PO5', title: 'Modern Tool Usage', desc: 'Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.' },
    { code: 'PO6', title: 'The Engineer and Society', desc: 'Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.' },
    { code: 'PO7', title: 'Environment and Sustainability', desc: 'Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.' },
    { code: 'PO8', title: 'Ethics', desc: 'Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.' },
    { code: 'PO9', title: 'Individual and Team Work', desc: 'Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.' },
    { code: 'PO10', title: 'Communication', desc: 'Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.' },
    { code: 'PO11', title: 'Project Management and Finance', desc: 'Demonstrate knowledge and understanding of the engineering and management principles and apply these to one’s own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.' },
    { code: 'PO12', title: 'Life-long Learning', desc: 'Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.' }
  ];

  // explorer courses state handled dynamically

  // Notifications feed list
  const notificationsList = [
    { id: 1, title: 'CSE R2023 semester 5 curriculum finalized', desc: 'The curriculum scheme and syllabus drafts for Semester 5 of regulation R2023 have been fully approved by HOD.', time: '2 hours ago', cat: 'Updates', type: 'success' },
    { id: 2, title: 'Syllabus reference materials updated', desc: 'New prescribed textbooks and reference books have been appended to CS3301 course definition by coordinator.', time: '1 day ago', cat: 'Updates', type: 'info' },
    { id: 3, title: 'Annual Academic Audit Schedule', desc: 'The internal curriculum audit for NBA accreditation readiness will commence from June 15th.', time: '3 days ago', cat: 'Announcements', type: 'warning' },
    { id: 4, title: 'System Maintenance: Backup successfully run', desc: 'Global curriculum metadata tables successfully backed up onto secondary university storage node.', time: '5 days ago', cat: 'System', type: 'system' }
  ];

  const poCodes = dbPos.length > 0
    ? dbPos.map((po, idx) => po.code || po.poCode || `PO${idx + 1}`)
    : Array.from({ length: 12 }, (_, i) => `PO${i + 1}`);
  const psoCodes = dbPsos.length > 0
    ? dbPsos.map((pso, idx) => pso.code || pso.psoCode || `PSO${idx + 1}`)
    : ['PSO1', 'PSO2', 'PSO3'];
  const poReferenceOutcomes = dbPos.length > 0
    ? dbPos.map((po, idx) => ({ code: po.code || po.poCode || `PO${idx + 1}`, title: '', desc: po.description || '' }))
    : programOutcomes;
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'builder') {
      setBookViewMode('directory');
    }
  };
  const publishedRegulations = regulations.filter((reg: any) => {
    // Match against API result safely with string coercion
    const isInApi = publishedBookReviews.some((review: any) => String(review.regulationId) === String(reg._id));
    
    // Also match against embedded reviews to guarantee DB connectivity
    const isInReg = reg.curriculumBookReviews && Array.isArray(reg.curriculumBookReviews) && reg.curriculumBookReviews.some((review: any) => {
      const revDeptId = review.departmentId?._id || review.departmentId;
      return String(revDeptId) === String(selectedDepartment?._id) && review.status === 'Published';
    });
    
    return isInApi || isInReg;
  });

  useEffect(() => {
    console.log('[DEBUG FacultyDashboard]', {
      regulationsCount: regulations.length,
      publishedBookReviewsCount: publishedBookReviews.length,
      publishedRegulationsCount: publishedRegulations.length,
      publishedBookReviews,
      regulations: regulations.map(r => ({ _id: r._id, code: r.code }))
    });
  }, [regulations, publishedBookReviews, publishedRegulations]);

  return (
    <div className="space-y-6 font-sans w-full max-w-none">

      {/* ============================================================== */}
      {/* 1. DASHBOARD PAGE */}
      {/* ============================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn w-full">

          {/* ── Welcome Header ───────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 flex flex-col sm:flex-row items-start gap-5 w-full">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-sm flex-shrink-0">
              {getInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest">Aditya University · Faculty Portal</p>
              <h1 className="text-xl font-bold text-text-primary mt-0.5">Welcome back, {user?.name || 'Ms. S. Anusha'}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-semibold">{getRoleLabel()}</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">{getDepartmentName()}</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-success-50 text-success-700 border border-success-100 text-[11px] font-semibold">{getDepartmentCode()} · Active Semester</span>
              </div>
            </div>
          </div>

          {/* ── Overview Stat Cards ────────────────────────── */}
          <div className="grid gap-6 w-full" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {/* Card 1: Assigned Courses */}
            <div className="bg-white rounded-2xl border border-border shadow-card p-6 flex items-center gap-5 hover:shadow-card-md hover:border-border-medium transition-all w-full">
              <div className="w-11 h-11 rounded-xl bg-success-50 border border-success-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-success-600" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-text-primary leading-none">{approvedCourses.length}</p>
                <p className="text-[11px] font-semibold text-text-muted mt-1">Assigned Courses</p>
                <p className="text-[10px] text-text-subtle mt-0.5">This Semester</p>
              </div>
            </div>

            {/* Card 2: Finalized Curriculum */}
            <div className="bg-white rounded-2xl border border-border shadow-card p-6 flex items-center gap-5 hover:shadow-card-md hover:border-border-medium transition-all w-full">
              <div className="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-text-primary leading-none">{finalizedCount}</p>
                <p className="text-[11px] font-semibold text-text-muted mt-1">Finalized Curriculum</p>
              </div>
            </div>
          </div>

          {/* ── Assigned Courses Section ──────────────────── */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-6 w-full">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-subtle">Assigned Courses</h3>
              <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-extrabold uppercase font-sans tracking-wide">{approvedCourses.length} Total</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full py-8 text-center text-slate-500 font-semibold animate-pulse">Loading approved courses...</div>
              ) : approvedCourses.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-500 font-semibold">No approved courses found for this regulation.</div>
              ) : (
                approvedCourses.slice(0, showAllCourses ? approvedCourses.length : 3).map((v) => {
                  const course = v.courseId || {};
                  return (
                    <div key={v._id} className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between hover:shadow-sm hover:bg-slate-50 transition-all space-y-4">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold font-mono text-indigo-650 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-lg">{course.code}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold border bg-primary-50 text-primary-700 border-primary-100`}>
                            {v.category || 'Theory'}
                          </span>
                        </div>
                        
                        <h4 className="text-xs font-extrabold text-slate-800 mt-2.5 leading-snug">{course.title}</h4>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-bold">
                          <span>Semester {v.semester}</span>
                          <span>|</span>
                          <span>{selectedDepartment?.code || 'Dept'}</span>
                          <span>|</span>
                          <span>{selectedRegulation?.code || 'Reg'}</span>
                        </div>
                        
                        <p className="text-[10px] text-slate-455 font-bold mt-1.5">Credits: {v.credits?.C || 3}</p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/60 text-[11px] font-bold">
                        <button
                          onClick={() => setPreviewCourse(v)}
                          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Course Syllabus</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {approvedCourses.length > 3 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowAllCourses(!showAllCourses)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {showAllCourses ? 'View Less' : 'View More'}
                </button>
              </div>
            )}
          </div>

          {previewCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">
                <div className="sticky top-0 right-0 p-4 flex justify-between items-center bg-white border-b border-slate-200 z-10">
                  <h3 className="font-bold text-slate-800">Course Syllabus Preview</h3>
                  <button onClick={() => setPreviewCourse(null)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold cursor-pointer transition-colors">
                    <X className="w-4 h-4" />
                    Close
                  </button>
                </div>
                <div className="p-8 pb-12 bg-slate-50">
                  <div className="bg-white shadow-sm border border-slate-200 mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
                    <PdfCoursePageStyles />
                    <PdfCoursePage 
                      courseVersion={previewCourse} 
                      departmentName={getDepartmentName()} 
                      departmentCode={getDepartmentCode()} 
                      regulationYear={selectedRegulation?.academicYear || '2024'} 
                      showLogo={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* ============================================================== */}
        </div>
      )}

      {/* 4.5 CURRICULUM BOOK */}
      {/* ============================================================== */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {bookViewMode === 'view' ? (
            <div className="space-y-4">
              <button
                onClick={() => setBookViewMode('directory')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold cursor-pointer w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Directory
              </button>
              <CurriculumBookGenerator />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-extrabold text-slate-800">Curriculum Books Directory</h2>
                <p className="text-sm text-slate-500 mt-1">Access the generated curriculum books for your department's regulations.</p>
              </div>

              <div className="space-y-8 animate-fadeIn">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
                    {selectedDepartment?.name || 'Your Department'} Regulations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {publishedRegulations.map((reg: any) => (
                      <div key={reg._id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors bg-slate-50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100/50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>
                        <h4 className="font-extrabold text-slate-800 text-lg relative z-10">{reg.code}</h4>
                        <p className="text-xs text-slate-500 font-medium mb-4 relative z-10">Academic Year: {reg.academicYear}</p>
                        
                        <div className="flex flex-wrap gap-2 relative z-10">
                          <button
                            onClick={() => {
                              setSelectedRegulation(reg);
                              setBookViewMode('view');
                              setActiveTab('builder');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Book
                          </button>
                        </div>
                      </div>
                    ))}
                    {publishedRegulations.length === 0 && (
                      <div className="col-span-full py-10 text-center text-slate-500 text-sm font-semibold">
                        No published curriculum books are available for your department yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. PROFILE PAGE */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Green success banner — only shown after save */}
          {(showProfileSuccess || profileSuccess) && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between gap-3 font-semibold">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                <span>Profile updated successfully.</span>
              </div>
              <button onClick={() => setShowProfileSuccess(false)} className="text-emerald-600 hover:text-emerald-800 transition-colors" aria-label="Dismiss">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div>
            <h1 className="text-xl font-extrabold text-slate-800 font-sans">Profile</h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Manage your profile and preferences.</p>
          </div>

          {/* Faculty Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-850">Faculty Information</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Your professional details and contact information</p>
              </div>
              {/* Faculty profile is read-only — managed by Admin */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 font-medium">
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>Profile managed by Admin</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-xs">
              
              {/* Full Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Full Name</span>
                  <strong className="text-slate-800 font-bold text-xs mt-0.5 block">{user?.name || 'Ms. S. Anusha'}</strong>
                </div>
              </div>

              {/* Designation */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Designation</span>
                  <strong className="text-slate-800 font-bold text-xs mt-0.5 block">{user?.role === 'Faculty' ? 'Assistant Professor' : user?.role || 'Associate Professor'}</strong>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Email</span>
                  <strong className="text-slate-855 font-mono text-xs mt-0.5 block">{user?.email || 'anusha.faculty@aditya.edu.in'}</strong>
                </div>
              </div>

              {/* Employee ID */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Employee ID</span>
                  <strong className="text-slate-800 font-mono text-xs mt-0.5 block">FAC-{user?.id?.substring(0, 4) || '1024'}</strong>
                </div>
              </div>

              {/* Department */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Department</span>
                  <strong className="text-slate-800 font-bold text-xs mt-0.5 block">{user?.department?.name || 'Computer Science and Engineering'}</strong>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Phone Number</span>
                  <strong className="text-slate-800 font-mono text-xs mt-0.5 block">+91 98765 43210</strong>
                </div>
              </div>

            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-855">Preferences</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Customize your application experience</p>
            </div>

            <div className="divide-y divide-slate-100">
              
              {/* Toggle 1 */}
              <div className="py-4 first:pt-0 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800">Email Notifications</h4>
                  <p className="text-slate-500 font-medium">Receive email updates about important activities</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailNotif} 
                    onChange={(e) => setEmailNotif(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Toggle 2 */}
              <div className="py-4 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800">ERP Updates</h4>
                  <p className="text-slate-500 font-medium">Stay updated with general portal updates and patch logs</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={erpUpdates} 
                    onChange={(e) => setErpUpdates(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Toggle 3 */}
              <div className="py-4 last:pb-0 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800">Announcement Alerts</h4>
                  <p className="text-slate-500 font-medium">Get notifications for department announcement circulars</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={announcementAlerts} 
                    onChange={(e) => setAnnouncementAlerts(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-sans">Security & Access</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage your credentials and login safety</p>
            </div>
            
            <div className="divide-y divide-slate-100 text-xs font-bold text-slate-500 font-sans">
              
              {/* Change Password */}
              <div className="py-4 first:pt-0 last:pb-0 flex justify-between items-center">
                <div className="space-y-0.5 text-left">
                  <h4 className="font-bold text-slate-800">Change Password</h4>
                  <p className="text-slate-500 font-medium font-sans">Update your account login credentials</p>
                </div>
                <button 
                  onClick={() => setChangePasswordModalOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FacultyDashboard;
