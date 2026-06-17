import React, { useEffect, useState, useRef } from 'react';
import Papa from 'papaparse';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { useUIStore } from '../../store/uiStore';
import {
  Building, Settings, FileSpreadsheet, Shield, Plus,
  RotateCw, Layers, CheckCircle2, AlertCircle, Calendar,
  CheckSquare, Award, Users, FileText, Bell, Sparkles,
  UserPlus, Edit3, Trash2, Check, X, ArrowLeft, Download,
  Eye, KeyRound, Globe, User, BookOpen, Printer, CheckSquare as CheckSquareIcon,
  Briefcase, Phone, Cpu, Building2, Mail
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import Select from 'react-select';
import { PDFDocument, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
import CurriculumBuilder from '../hod/CurriculumBuilder';
import { CurriculumBookGenerator } from '../../components/common/CurriculumBookGenerator';
import { useContextStore } from '../../store/contextStore';

interface AdminDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuthStore();
  const { selectedRegulation, selectedDepartment, setSelectedProgram, setSelectedDepartment, setSelectedRegulation } = useContextStore();
  
  // Curriculum Books & Builder Directory state
  const [bookViewMode, setBookViewMode] = useState<'directory' | 'view'>('directory');
  const [builderViewMode, setBuilderViewMode] = useState<'directory' | 'edit'>('directory');
  const [selectedDirProgram, setSelectedDirProgram] = useState<string | null>(null);

  // Global context & state
  const [stats, setStats] = useState({
    programs: 8,
    departments: 8,
    regulations: 3,
    courses: 1402,
    pending: 52,
    published: 89
  });

  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [approvalsQueue, setApprovalsQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & form states
  const [programModal, setProgramModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data: any }>({ open: false, mode: 'add', data: { name: '', code: '', description: '', category: 'Engineering', degree: '', duration: 4, numberOfSemesters: 8, totalCredits: 160, vision: '', mission: '' } });
  const [deptModal, setDeptModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data: any }>({ open: false, mode: 'add', data: { name: '', code: '', programId: '', regulationId: '', description: '' } });
  const [assignHodModal, setAssignHodModal] = useState<{ open: boolean; data: any }>({ open: false, data: { programId: '', departmentId: '', userId: '' } });
  const [deptRegulations, setDeptRegulations] = useState<any[]>([]);
  const [programRegModal, setProgramRegModal] = useState<{ open: boolean; program: any; regulations: any[] }>({ open: false, program: null, regulations: [] });
  const [regModal, setRegModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data: any }>({ open: false, mode: 'add', data: { code: '', academicYear: new Date().getFullYear(), durationYears: 4, semesterCount: 8, programId: '' } });
  const [userModal, setUserModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data: any }>({ open: false, mode: 'add', data: { name: '', email: '', password: '', role: 'Faculty', departmentId: '', programId: '' } });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Outcomes manager context state
  const [poSelectedReg, setPoSelectedReg] = useState('');
  const [poSelectedDept, setPoSelectedDept] = useState('');
  const [peoPso, setPeoPso] = useState<any>({ peos: [], psos: [], pos: [] });

  // Approvals comments modal
  const [reviewCommentsModal, setReviewCommentsModal] = useState<{ open: boolean; version: any; action: 'Approve' | 'Return' | 'Reject' }>({ open: false, version: null, action: 'Approve' });
  const [reviewComments, setReviewComments] = useState('');

  // Curriculum Remarks modal
  const [curriculumRemarkModal, setCurriculumRemarkModal] = useState<{ open: boolean; regId: string | null }>({ open: false, regId: null });
  const [curriculumRemark, setCurriculumRemark] = useState('');

  // Search/Filters states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [approvalTabFilter, setApprovalTabFilter] = useState<'Pending' | 'HOD Approved' | 'Returned' | 'All'>('Pending');

  // University Settings state
  const [universitySettings, setUniversitySettings] = useState({
    name: 'Aditya University',
    shortName: 'AU',
    address: 'Aditya Nagar, ADB Road, Surampalem, Kakinada, Andhra Pradesh - 533437',
    email: 'info@aditya.edu.in',
    phone: '08852-252243',
  });

  // Profile Standardized States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [phoneVal, setPhoneVal] = useState('+91 9800001234');
  const [altEmailVal, setAltEmailVal] = useState('admin.alt@aditya.edu.in');
  const [profileImageVal, setProfileImageVal] = useState('');
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);
  const { profileSuccess, setProfileSuccess, setChangePasswordModalOpen } = useUIStore();

  // Admin Preferences States
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [userRegistrationNotif, setUserRegistrationNotif] = useState(true);
  const [erpMaintenanceUpdates, setErpMaintenanceUpdates] = useState(false);
  const [backupCompletionNotif, setBackupCompletionNotif] = useState(true);

  // Load backend data
  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch Programs
      const progRes = await api.programs.list();
      setPrograms(progRes.programs);

      // Fetch Departments
      const deptRes = await api.programs.listDept();
      setDepartments(deptRes.departments);

      // Fetch Regulations
      const regRes = await api.regulations.list();
      setRegulations(regRes.regulations);

      // Fetch Users
      const userRes = await api.users.list();
      setUsers(userRes.users);

      // Fetch Approvals queue (we load all course versions to filter dynamically)
      if (regRes.regulations.length > 0) {
        // Fetch all course versions under the active regulation
        const verPromises = regRes.regulations.map((r: any) => api.courses.listByReg(r._id));
        const allVersRes = await Promise.all(verPromises);
        const aggregatedVersions = allVersRes.flatMap((res: any) => res.versions || []);
        setApprovalsQueue(aggregatedVersions);

        // Update stats
        const pendingCount = aggregatedVersions.filter((v: any) => v.status === 'Pending Admin' || v.status === 'Pending HOD').length;
        const publishedCount = aggregatedVersions.filter((v: any) => v.status === 'Approved').length;
        setStats({
          programs: progRes.programs.length,
          departments: deptRes.departments.length,
          regulations: regRes.regulations.length,
          courses: aggregatedVersions.length,
          pending: pendingCount,
          published: publishedCount
        });

        // Initialize PO selections
        setPoSelectedReg(regRes.regulations[0]._id);
        if (deptRes.departments.length > 0) {
          setPoSelectedDept(deptRes.departments[0]._id);
        }
      }
      
      // Initialize selected directory program
      if (progRes.programs.length > 0) {
        setSelectedDirProgram(progRes.programs[0]._id);
      }
    } catch (err) {
      console.error('[AdminDashboard] Error fetching backend details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Load outcomes when selected PO department context changes
  useEffect(() => {
    const loadPoPso = async () => {
      if (!poSelectedDept) return;
      try {
        const res = await api.peoPso.getByDept(poSelectedDept);
        if (res.peoPso) {
          setPeoPso(res.peoPso);
        } else {
          setPeoPso({ peos: [], psos: [], pos: [] });
        }
      } catch (err) {
        console.error('[AdminDashboard] Failed to fetch PO outcomes:', err);
      }
    };
    loadPoPso();
  }, [poSelectedDept]);

  // Load regulations when program is selected in Add Department Modal
  useEffect(() => {
    const fetchRegs = async () => {
      if (deptModal.open && deptModal.data.programId) {
        try {
          const res = await api.regulations.listByProgram(deptModal.data.programId);
          setDeptRegulations(res.regulations || []);
        } catch (err) {
          console.error('[AdminDashboard] Failed to load regulations for program:', err);
        }
      } else {
        setDeptRegulations([]);
      }
    };
    fetchRegs();
  }, [deptModal.data.programId, deptModal.open]);

  // Create/Update Program
  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (programModal.mode === 'add') {
        await api.programs.create(programModal.data);
      } else {
        await api.programs.update(programModal.data._id, programModal.data);
      }
      alert(`Program successfully ${programModal.mode === 'add' ? 'created' : 'updated'}!`);
      setProgramModal({ open: false, mode: 'add', data: {} });
      loadData();
    } catch (err: any) {
      alert(`Program operation failed: ${err.message}`);
    }
  };

  // Toggle Program Status
  const handleToggleProgram = async (id: string) => {
    try {
      await api.programs.delete(id); // Backend endpoint deactivates
      loadData();
    } catch (err: any) {
      alert(`Failed to toggle program state: ${err.message}`);
    }
  };

  // Create/Update Department
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (deptModal.mode === 'add') {
        await api.programs.createDept(deptModal.data);
      } else {
        await api.programs.updateDept(deptModal.data._id, deptModal.data);
      }
      alert(`Department successfully ${deptModal.mode === 'add' ? 'created' : 'updated'}!`);
      setDeptModal({ open: false, mode: 'add', data: {} });
      loadData();
    } catch (err: any) {
      alert(`Department operation failed: ${err.message}`);
    }
  };

  // Toggle Department Status
  const handleToggleDept = async (id: string) => {
    try {
      await api.programs.deleteDept(id);
      loadData();
    } catch (err: any) {
      alert(`Failed to toggle department state: ${err.message}`);
    }
  };

  // Assign HOD
  const handleAssignHodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.programs.assignHod(assignHodModal.data.departmentId, { userId: assignHodModal.data.userId });
      alert('HOD assigned successfully!');
      setAssignHodModal({ open: false, data: { programId: '', departmentId: '', userId: '' } });
      loadData();
    } catch (err: any) {
      alert(`HOD assignment failed: ${err.message}`);
    }
  };

  // Create/Update Regulation
  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (regModal.mode === 'add') {
        await api.regulations.create(regModal.data);
      } else {
        await api.regulations.update(regModal.data._id, regModal.data);
      }
      alert(`Regulation successfully ${regModal.mode === 'add' ? 'created' : 'updated'}!`);
      setRegModal({ open: false, mode: 'add', data: {} });
      loadData();
    } catch (err: any) {
      alert(`Regulation operation failed: ${err.message}`);
    }
  };

  // Toggle Regulation Status
  const handleToggleReg = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this regulation? This action cannot be undone.')) return;
    try {
      await api.regulations.delete(id);
      loadData();
    } catch (err: any) {
      alert(`Failed to delete regulation: ${err.message}`);
    }
  };

  // Create/Update User
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...userModal.data };
      if (!payload.password && userModal.mode === 'add') {
        payload.password = 'temp123'; // Default temp password
      }
      if (userModal.mode === 'add') {
        await api.users.create(payload);
      } else {
        await api.users.update(payload._id, payload);
      }
      alert(`User account successfully ${userModal.mode === 'add' ? 'registered' : 'modified'}!`);
      setUserModal({ open: false, mode: 'add', data: {} });
      loadData();
    } catch (err: any) {
      alert(`User administration failed: ${err.message}`);
    }
  };

  // Toggle User Status
  const handleToggleUser = async (id: string) => {
    try {
      await api.users.delete(id);
      loadData();
    } catch (err: any) {
      alert(`Failed to toggle user account state: ${err.message}`);
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedUsers = results.data.map((row: any) => {
            // Find department and program IDs based on codes, if provided
            const dept = departments.find(d => d.code === row.departmentCode || d.name === row.departmentCode);
            const prog = programs.find(p => p.code === row.programCode || p.name === row.programCode);

            return {
              name: row.name,
              email: row.email,
              role: row.role || 'Faculty',
              departmentId: dept?._id || null,
              programId: prog?._id || null,
              password: row.password || 'temp123'
            };
          });

          if (parsedUsers.length === 0) {
            return alert('No valid data found in CSV.');
          }

          setLoading(true);
          const res = await (api.users as any).bulkCreate({ users: parsedUsers });
          alert(`Bulk upload completed:\n${res.message}\n${res.errors?.length ? 'Errors:\\n' + res.errors.join('\\n') : ''}`);
          loadData();
        } catch (err: any) {
          alert(`Bulk upload failed: ${err.message}`);
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error: any) => {
        alert(`CSV Parsing error: ${error.message}`);
      }
    });
  };

  // Save Outcoming Matrix PEO/PSO
  const handleSaveOutcomes = async () => {
    try {
      await api.peoPso.updateByDept(poSelectedDept, peoPso);
      alert('Objectives, PSOs and PO outcomes successfully saved for department context.');
      loadData();
    } catch (err: any) {
      alert(`Failed to save objectives: ${err.message}`);
    }
  };

  const handleSendRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curriculumRemarkModal.regId) return;

    try {
      await api.regulations.update(curriculumRemarkModal.regId, { status: 'Draft' });
      alert('Remarks successfully sent to HOD! Regulation status has been set to Draft.');
      setCurriculumRemarkModal({ open: false, regId: null });
      setCurriculumRemark('');
      loadData();
    } catch (err: any) {
      alert(`Failed to send remarks: ${err.message}`);
    }
  };

  // Workflow decisions
  const handleWorkflowSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    const { version, action } = reviewCommentsModal;
    if (!version) return;

    let targetStatus = 'Approved';
    if (action === 'Return') targetStatus = 'Returned';
    if (action === 'Reject') targetStatus = 'Returned'; // Reject maps to Returned in schema

    try {
      await api.courses.updateStatus(version._id, {
        status: targetStatus,
        comments: reviewComments
      });
      alert(`Curriculum structure successfully updated to [${targetStatus}].`);
      setReviewCommentsModal({ open: false, version: null, action: 'Approve' });
      setReviewComments('');
      loadData();
    } catch (err: any) {
      alert(`Workflow transition failed: ${err.message}`);
    }
  };

  // Reports Generation pdf-lib & docx
  const generatePDF = async (reportName: string, customDept?: any, customReg?: any) => {
    try {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([595.276, 841.89]); // A4 Size
      const { height } = page.getSize();
      
      const targetDept = customDept || selectedDepartment;
      const targetReg = customReg || selectedRegulation;

      // Header branding
      page.drawText('ADITYA UNIVERSITY', { x: 50, y: height - 60, size: 20, color: rgb(0.04, 0.1, 0.28) });
      page.drawText('Accreditation Governance Portal — OBE Syllabus Scheme', { x: 50, y: height - 80, size: 10, color: rgb(0.4, 0.4, 0.4) });

      // Report Title
      page.drawText(reportName.toUpperCase(), { x: 50, y: height - 130, size: 15, color: rgb(0.11, 0.3, 0.85) });

      // Meta details block
      page.drawText(`Regulation Code Context: ${targetReg?.code || 'N/A'}`, { x: 50, y: height - 170, size: 11 });
      page.drawText(`Department Scope: ${targetDept?.name || 'N/A'}`, { x: 50, y: height - 190, size: 11 });
      page.drawText(`Generated on: ${new Date().toLocaleString()}`, { x: 50, y: height - 210, size: 10, color: rgb(0.5, 0.5, 0.5) });
      page.drawText(`Verification Digital Key: SHA256-AU-OBE-${Math.random().toString(36).substring(3).toUpperCase()}`, { x: 50, y: height - 230, size: 9, color: rgb(0.5, 0.5, 0.5) });

      // Draw lines
      page.drawLine({ start: { x: 50, y: height - 100 }, end: { x: 545, y: height - 100 }, thickness: 1.5, color: rgb(0.1, 0.1, 0.1) });
      page.drawLine({ start: { x: 50, y: height - 250 }, end: { x: 545, y: height - 250 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

      // Core content mock
      page.drawText('ACADEMIC CURRICULUM OVERVIEW DETAILS:', { x: 50, y: height - 280, size: 11, color: rgb(0.1, 0.1, 0.1) });
      page.drawText('1. Continuous Internal Evaluation (CIE) standard setup: Max Marks 40.', { x: 60, y: height - 310, size: 10 });
      page.drawText('2. Semester End Examinations (SEE) standard setup: Max Marks 60.', { x: 60, y: height - 330, size: 10 });
      page.drawText('3. Total POs mapped: 12 Programs Accreditation Outcomes mapped successfully.', { x: 60, y: height - 350, size: 10 });
      page.drawText(`4. Curriculum approved by Faculty Board & HOD ${targetDept?.code || ''} on ${new Date().toLocaleDateString()}.`, { x: 60, y: height - 370, size: 10 });

      // Signatures
      page.drawText('Approved By HOD', { x: 80, y: 150, size: 10, color: rgb(0.2, 0.2, 0.2) });
      page.drawText('Signed Digitally', { x: 80, y: 135, size: 8, color: rgb(0.5, 0.5, 0.5) });

      page.drawText('Approved By Admin', { x: 380, y: 150, size: 10, color: rgb(0.2, 0.2, 0.2) });
      page.drawText('Syllabus Accreditations Portal', { x: 380, y: 135, size: 8, color: rgb(0.5, 0.5, 0.5) });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportName.toLowerCase().replace(/\s+/g, '_')}_report.pdf`;
      link.click();
    } catch (err) {
      console.error('PDF generation error', err);
    }
  };

  const generateDOCX = async (reportName: string, customDept?: any, customReg?: any) => {
    try {
      const targetDept = customDept || selectedDepartment;
      const targetReg = customReg || selectedRegulation;
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "ADITYA UNIVERSITY", bold: true, size: 28, color: "071A3D" }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Outcome Based Education Accreditation Portal", size: 18, color: "666666" }),
              ],
            }),
            new Paragraph({
              spacing: { before: 240, after: 120 },
              children: [
                new TextRun({ text: reportName.toUpperCase(), bold: true, size: 24, color: "1D4ED8" }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Regulation Code: ${targetReg?.code || 'N/A'}\n`, size: 11 }),
                new TextRun({ text: `Department Scope: ${targetDept?.name || 'N/A'}\n`, size: 11 }),
                new TextRun({ text: `Generated on: ${new Date().toLocaleString()}\n`, size: 10, color: "888888" }),
              ],
            }),
            new Paragraph({
              spacing: { before: 200 },
              children: [
                new TextRun({ text: "CURRICULUM MAPPING STATEMENT:", bold: true, size: 14 }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `This ${reportName.toLowerCase()} is generated automatically under validation standards. Program Outcomes (POs 1-12) and Program Specific Outcomes (PSOs 1-3) correspond to AICTE/NBA guidelines for ${targetDept?.name || 'the department'}.`, size: 11 }),
              ],
            }),
          ],
        }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportName.toLowerCase().replace(/\s+/g, '_')}_report.docx`;
      link.click();
    } catch (err) {
      console.error('Word generation error', err);
    }
  };

  // Recharts Overview mock data matching screenshots
  const approvalTrendsData = [
    { month: 'Jan', approvals: 12 },
    { month: 'Feb', approvals: 25 },
    { month: 'Mar', approvals: 18 },
    { month: 'Apr', approvals: 42 },
    { month: 'May', approvals: 52 },
    { month: 'Jun', approvals: 30 }
  ];

  const deptCompletionData = [
    { name: 'CSE', value: 80 },
    { name: 'ECE', value: 72 },
    { name: 'Mechanical', value: 60 },
    { name: 'Civil', value: 55 },
    { name: 'EEE', value: 50 },
    { name: 'Others', value: 50 }
  ];

  const regDistributionData = [
    { name: 'R23', value: 45 },
    { name: 'R25', value: 35 },
    { name: 'Others', value: 20 }
  ];

  const COLORS_COMPLETION = ['#1D4ED8', '#071A3D', '#F59E0B', '#16A34A', '#8B5CF6', '#EC4899'];
  const COLORS_REG = ['#1D4ED8', '#F59E0B', '#64748B'];

  return (
    <div className="space-y-6 font-sans">

      {/* 1. OVERVIEW DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">

          {/* ── Welcome Header ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-border shadow-card p-6 flex flex-col sm:flex-row items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold text-xl shadow-sm flex-shrink-0">
              {(() => {
                if (!user?.name) return 'AD';
                return user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest">Aditya University · OBE Portal</p>
                  <h1 className="text-xl font-bold text-text-primary mt-0.5">Welcome back, {user?.name || 'Administrator'}</h1>
                </div>
                <button
                  onClick={loadData}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-bg hover:bg-surface-hover text-text-muted rounded-xl text-xs font-semibold transition-all border border-border cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-[11px] font-semibold">System Administrator</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">Office of Academic Governance</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-success-50 text-success-700 border border-success-100 text-[11px] font-semibold">AU Main Campus · Administration</span>
              </div>
              <p className="text-sm text-text-muted mt-3 leading-relaxed">
                Managing {stats.programs} programs, {stats.departments} departments, and {stats.regulations} active regulation contexts with accreditation audit tracking.
              </p>
            </div>
          </div>

          {/* ── KPI Stat Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Total Programs', sub: 'Active academic programs', count: stats.programs, icon: Layers, bg: 'bg-blue-50', iconCl: 'text-blue-600', border: 'border-blue-100' },
              { label: 'Departments', sub: 'University departments', count: stats.departments, icon: Building, bg: 'bg-indigo-50', iconCl: 'text-indigo-600', border: 'border-indigo-100' },
              { label: 'Regulations', sub: 'Active schemes', count: stats.regulations, icon: Settings, bg: 'bg-amber-50', iconCl: 'text-amber-600', border: 'border-amber-100' },
              { label: 'Total Courses', sub: 'Across all regulations', count: stats.courses, icon: BookOpen, bg: 'bg-slate-50', iconCl: 'text-slate-600', border: 'border-slate-200' },
              { label: 'Pending Approvals', sub: 'Needs immediate action', count: stats.pending, icon: CheckSquare, bg: 'bg-danger-50', iconCl: 'text-danger-600', border: 'border-danger-100' },
              { label: 'Published', sub: 'Approved curriculum', count: stats.published, icon: CheckCircle2, bg: 'bg-success-50', iconCl: 'text-success-700', border: 'border-success-100' },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-border shadow-card p-5 flex flex-col gap-3 hover:shadow-card-md hover:border-border-medium transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${kpi.bg} ${kpi.border}`}>
                    <Icon className={`w-4.5 h-4.5 ${kpi.iconCl}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-text-primary leading-none">{kpi.count}</p>
                    <p className="text-[11px] font-semibold text-text-muted mt-1">{kpi.label}</p>
                    <p className="text-[10px] text-text-subtle mt-0.5">{kpi.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-6">

            {/* Approval Trends Line Chart */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text-subtle">Approval Trends</h3>
                <span className="text-[10px] text-text-muted font-semibold bg-surface-bg px-2.5 py-1 rounded-full border border-border">This Year</span>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={approvalTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} />
                    <YAxis stroke="#94A3B8" fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="approvals" stroke="#1D4ED8" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Completion Rate Donut Chart */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text-subtle">Dept. Completion Rate</h3>
                <span className="text-[10px] text-text-muted font-semibold bg-surface-bg px-2.5 py-1 rounded-full border border-border">This Year</span>
              </div>
              <div className="h-60 flex items-center justify-between">
                <div className="relative w-1/2 h-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deptCompletionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {deptCompletionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_COMPLETION[index % COLORS_COMPLETION.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400 leading-none">Overall</span>
                    <strong className="block text-lg font-extrabold text-slate-800 leading-none mt-1">67%</strong>
                  </div>
                </div>
                {/* Custom Legend */}
                <div className="w-1/2 text-left pl-4 space-y-2 text-[10px] font-semibold text-slate-500 font-mono">
                  {deptCompletionData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_COMPLETION[i] }}></span>
                        <span>{d.name}</span>
                      </div>
                      <strong className="text-slate-800">{d.value}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Regulation Distribution Donut Chart */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text-subtle">Regulation Distribution</h3>
                <span className="text-[10px] text-text-muted font-semibold bg-surface-bg px-2.5 py-1 rounded-full border border-border">Active</span>
              </div>
              <div className="h-60 flex items-center justify-between">
                <div className="relative w-1/2 h-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {regDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_REG[index % COLORS_REG.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400 leading-none">Total</span>
                    <strong className="block text-lg font-extrabold text-slate-800 leading-none mt-1">6</strong>
                  </div>
                </div>
                {/* Custom Legend */}
                <div className="w-1/2 text-left pl-4 space-y-2 text-[10px] font-semibold text-slate-500 font-mono">
                  {regDistributionData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_REG[i] }}></span>
                        <span>{d.name}</span>
                      </div>
                      <strong className="text-slate-800">{d.value}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Pending Approvals & Timeline Row */}
          <div className="grid grid-cols-3 gap-6">

            {/* Timeline feed: Recent Activity */}
            <div className="bg-white p-6 rounded-2xl border border-border shadow-card space-y-4 flex flex-col h-[400px]">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text-subtle">Recent Activity</h3>
                <button className="text-[11px] text-primary-600 hover:underline font-semibold">View all</button>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {[
                  { title: 'HOD CSE submitted curriculum for R25 regulation', time: '10 mins ago', color: 'bg-primary-500' },
                  { title: 'Admin approved DBMS course (CS203)', time: '28 mins ago', color: 'bg-success-500' },
                  { title: 'New faculty Dr. Kumar added to ECE department', time: '1 hour ago', color: 'bg-info-500' },
                  { title: 'R25 CSE curriculum returned by admin', time: '2 hours ago', color: 'bg-warning-500' },
                  { title: 'Full curriculum report generated for R23 ECE', time: '3 hours ago', color: 'bg-violet-500' },
                ].map((act, idx) => (
                  <div key={idx} className="flex gap-3 text-xs leading-relaxed py-1">
                    <span className={`w-2 h-2 rounded-full ${act.color} mt-1.5 flex-shrink-0`}></span>
                    <div>
                      <p className="font-medium text-text-secondary">{act.title}</p>
                      <span className="text-[10px] text-text-subtle block mt-0.5">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Approvals Table */}
            <div className="col-span-2 bg-white p-6 rounded-2xl border border-border shadow-card space-y-4 flex flex-col h-[400px]">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-text-subtle">Pending Approvals</h3>
                <span className="obe-badge obe-badge-danger">Action Required</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-bg text-text-subtle uppercase font-semibold">
                      <th className="p-3 pl-4">#</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Regulation</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Submitted By</th>
                      <th className="p-3">Submitted On</th>
                      <th className="p-3 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalsQueue
                      .filter((v: any) => v.status === 'Pending Admin')
                      .slice(0, 5)
                      .map((v, i) => (
                        <tr key={v._id} className="border-b border-border-light hover:bg-surface-hover text-text-secondary font-medium transition-colors">
                          <td className="p-3 pl-4 font-bold text-text-muted">{i + 1}</td>
                          <td className="p-3 font-semibold text-text-primary">{v.courseId?.departmentId?.code || 'CSE'}</td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{v.regulationId?.code || 'R25'}</span>
                          </td>
                          <td className="p-3">
                            <span className="obe-badge obe-badge-neutral">Course File</span>
                          </td>
                          <td className="p-3 font-medium">{v.assignedCoordinator?.name || 'HOD CSE'}</td>
                          <td className="p-3 text-text-subtle text-[10px]">22 May 2025</td>
                          <td className="p-3 text-right pr-4">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setReviewCommentsModal({ open: true, version: v, action: 'Approve' })}
                                className="p-1.5 hover:bg-success-50 rounded-lg text-success-600 hover:text-success-700 cursor-pointer transition-colors"
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setReviewCommentsModal({ open: true, version: v, action: 'Return' })}
                                className="p-1.5 hover:bg-warning-50 rounded-lg text-warning-600 hover:text-warning-700 cursor-pointer transition-colors"
                                title="Return for Edit"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setReviewCommentsModal({ open: true, version: v, action: 'Reject' })}
                                className="p-1.5 hover:bg-danger-50 rounded-lg text-danger-600 hover:text-danger-700 cursor-pointer transition-colors"
                                title="Reject"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {approvalsQueue.filter((v: any) => v.status === 'Pending Admin').length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <CheckCircle2 className="w-10 h-10 mx-auto text-success-500 mb-2" />
                          <p className="text-sm font-semibold text-text-muted">All approvals cleared!</p>
                          <p className="text-xs text-text-subtle mt-1">No pending curriculum structures require administrative review.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. PROGRAM MANAGEMENT PAGE */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Program Management</h1>
              <p className="text-xs text-slate-500 mt-1 font-sans">Manage all dynamic academic programs offered across university departments.</p>
            </div>
            <button
              onClick={() => setProgramModal({ open: true, mode: 'add', data: { name: '', code: '', description: '', category: 'Engineering', degree: '', duration: 4, numberOfSemesters: 8, totalCredits: 160, vision: '', mission: '' } })}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Program</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/50 uppercase font-bold">
                  <th className="p-4 pl-6">#</th>
                  <th className="p-4">Program Name</th>
                  <th className="p-4">Program Code</th>
                  <th className="p-4">Degree</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Total Credits</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((prog, idx) => (
                  <tr key={prog._id} className="border-b border-slate-100 hover:bg-slate-50/20 text-slate-600 font-medium">
                    <td className="p-4 pl-6 font-bold">{idx + 1}</td>
                    <td className="p-4 font-bold text-slate-800">{prog.name}</td>
                    <td className="p-4 font-mono font-bold text-blue-600">{prog.code}</td>
                    <td className="p-4">{prog.degree || 'B.Tech'}</td>
                    <td className="p-4 text-slate-500">{prog.duration || 4} Years</td>
                    <td className="p-4 text-slate-500">{prog.totalCredits || 160} Credits</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border ${prog.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                        {prog.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right flex justify-end gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.regulations.listByProgram(prog._id);
                            setProgramRegModal({ open: true, program: prog, regulations: res.regulations || [] });
                          } catch (err) {
                            console.error('Failed to fetch program regulations:', err);
                            alert('Failed to load regulations for this program.');
                          }
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="View Regulations"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('departments');
                          setDeptModal({ open: true, mode: 'add', data: { name: '', code: '', programId: prog._id, regulationId: '', description: '' } });
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Add Department"
                      >
                        <Building className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setProgramModal({ open: true, mode: 'edit', data: prog })}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleProgram(prog._id)}
                        className={`p-1 hover:bg-slate-100 rounded cursor-pointer ${prog.isActive !== false ? 'text-red-500 hover:text-red-700' : 'text-emerald-600'}`}
                        title={prog.isActive !== false ? 'Deactivate' : 'Activate'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. DEPARTMENT MANAGEMENT PAGE */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Department Management</h1>
              <p className="text-xs text-slate-500 mt-1">Manage academic departments linked under university programs.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAssignHodModal({ open: true, data: { programId: programs[0]?._id || '', departmentId: '', userId: '' } })}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assign HOD</span>
              </button>
              <button
                onClick={() => setDeptModal({ open: true, mode: 'add', data: { name: '', code: '', programId: programs[0]?._id || '', description: '' } })}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/50 uppercase font-bold">
                  <th className="p-4 pl-6">#</th>
                  <th className="p-4">Department Name</th>
                  <th className="p-4">Department Code</th>
                  <th className="p-4">Program Context</th>
                  <th className="p-4">Faculty Count</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, idx) => (
                  <tr key={dept._id} className="border-b border-slate-100 hover:bg-slate-50/20 text-slate-600 font-medium">
                    <td className="p-4 pl-6 font-bold">{idx + 1}</td>
                    <td className="p-4 font-bold text-slate-800">{dept.name}</td>
                    <td className="p-4 font-mono font-bold text-blue-600">{dept.code}</td>
                    <td className="p-4 font-semibold text-xs text-slate-600 max-w-[200px] truncate" title={dept.programId?.code || 'None'}>
                      {dept.programId?.code || 'None'}
                    </td>
                    <td className="p-4 text-slate-500">12 Members</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border ${dept.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                        {dept.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right flex justify-end gap-2">
                      <button
                        onClick={() => setDeptModal({ open: true, mode: 'edit', data: dept })}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleDept(dept._id)}
                        className={`p-1 hover:bg-slate-100 rounded cursor-pointer ${dept.isActive !== false ? 'text-red-500 hover:text-red-700' : 'text-emerald-600'}`}
                        title={dept.isActive !== false ? 'Deactivate' : 'Activate'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. REGULATION MANAGEMENT PAGE */}
      {activeTab === 'regulations' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Regulation Management</h1>
              <p className="text-xs text-slate-500 mt-1">Configure active regulation schemes.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRegModal({ open: true, mode: 'add', data: { code: '', academicYear: new Date().getFullYear(), durationYears: 4, semesterCount: 8, programId: '' } })}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Regulation</span>
              </button>
            </div>
          </div>

          {/* Regulations Card grid */}
          <div className="grid grid-cols-3 gap-6">
            {regulations.map((reg) => (
              <div key={reg._id} className={`bg-white p-6 rounded-2xl border ${reg.isActive ? 'border-slate-200' : 'border-red-200 opacity-60'} shadow-sm flex flex-col justify-between h-[220px]`}>
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">{reg.programId?.name} Scheme</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${reg.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : reg.status === 'Archived'
                          ? 'bg-red-50 text-red-700 border-red-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                        {reg.status || 'Draft'}
                      </span>
                      <button onClick={() => handleToggleReg(reg._id)} className="text-slate-300 hover:text-red-500 transition-colors" title={reg.isActive ? "Deactivate Regulation" : "Activate Regulation"}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-extrabold text-academic-primary mt-2">{reg.code} Regulation</h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">Program Owner: {reg.programId?.name || 'All'}</p>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-medium text-slate-500">
                    <div>Academic Year: <strong className="text-slate-700">{reg.academicYear}</strong></div>
                    <div>Duration: <strong className="text-slate-700">{reg.durationYears} Years</strong></div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4 flex gap-2">
                  {(!reg.status || reg.status === 'Draft') && (
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to publish regulation ${reg.code}?`)) {
                          await api.regulations.update(reg._id, { ...reg, status: 'Published' });
                          loadData();
                        }
                      }}
                      className="flex-1 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer text-center"
                    >
                      Publish
                    </button>
                  )}
                  {reg.status === 'Published' && (
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to archive regulation ${reg.code}?`)) {
                          await api.regulations.update(reg._id, { ...reg, status: 'Archived' });
                          loadData();
                        }
                      }}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer text-center"
                    >
                      Archive
                    </button>
                  )}
                  {reg.status === 'Archived' && (
                    <button
                      onClick={async () => {
                        await api.regulations.update(reg._id, { ...reg, status: 'Draft' });
                        loadData();
                      }}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer text-center"
                    >
                      Restore Draft
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. PO MANAGEMENT PAGE */}
      {activeTab === 'po' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Program Outcomes (PO) Management</h1>
              <p className="text-xs text-slate-500 mt-1">Define Program Outcomes (POs) for regulation accreditation audits.</p>
            </div>
            <button
              onClick={handleSaveOutcomes}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Outlining Blueprint</span>
            </button>
          </div>

          {/* Context Picker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex gap-4 text-xs font-bold text-slate-500">
            <div className="space-y-1">
              <span className="block uppercase tracking-wider text-[10px]">Select Regulation</span>
              <select
                value={poSelectedReg}
                onChange={(e) => setPoSelectedReg(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 font-semibold bg-white outline-none w-48"
              >
                {regulations.map(r => (
                  <option key={r._id} value={r._id}>{r.code} Regulation</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <span className="block uppercase tracking-wider text-[10px]">Select Department</span>
              <select
                value={poSelectedDept}
                onChange={(e) => setPoSelectedDept(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 font-semibold bg-white outline-none w-64"
              >
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>


          {/* PO Outcomes definition */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <span>Standard Graduate Attributes & Program Outcomes (POs)</span>
              </h3>
              <button
                onClick={() => {
                  const list = peoPso.pos ? [...peoPso.pos] : [];
                  list.push({ code: `PO${list.length + 1}`, description: '' });
                  setPeoPso({ ...peoPso, pos: list });
                }}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                + Add PO
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {peoPso.pos?.map((po: any, idx: number) => (
                <div key={idx} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 relative group">
                  <span className="font-mono font-bold text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded mt-1">{po.code}</span>
                  <textarea
                    rows={2}
                    value={po.description}
                    onChange={(e) => {
                      const list = [...peoPso.pos];
                      list[idx].description = e.target.value;
                      setPeoPso({ ...peoPso, pos: list });
                    }}
                    className="flex-1 border border-slate-300 rounded-lg p-2 text-xs font-semibold outline-none bg-white"
                  />
                  <button
                    onClick={() => {
                      const list = [...peoPso.pos];
                      list.splice(idx, 1);
                      list.forEach((p, i) => p.code = `PO${i + 1}`);
                      setPeoPso({ ...peoPso, pos: list });
                    }}
                    className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 cursor-pointer self-start transition-colors"
                    title="Delete PO"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. USER MANAGEMENT PAGE */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">User Management</h1>
              <p className="text-xs text-slate-500 mt-1">Manage accreditation governance roles (Admin, HOD, Coordinator, Faculty) and department access mappings.</p>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Search name/email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-xs outline-none bg-white focus:ring-1 focus:ring-blue-500 w-52"
              />
              <input type="file" accept=".csv" ref={fileInputRef} hidden onChange={handleBulkUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm border border-slate-200 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Bulk Upload CSV</span>
              </button>
              <button
                onClick={() => setUserModal({ open: true, mode: 'add', data: { name: '', email: '', password: '', role: 'Faculty', departmentId: departments[0]?._id || '', programId: programs[0]?._id || '' } })}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/50 uppercase font-bold">
                  <th className="p-4 pl-6">Employee ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Program</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(u => u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
                  .map((u, i) => (
                    <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50/20 text-slate-600 font-medium">
                      <td className="p-4 pl-6 font-mono font-bold text-slate-400">AU{1001 + i}</td>
                      <td className="p-4 font-bold text-slate-800">{u.name}</td>
                      <td className="p-4 font-semibold">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${u.role === 'Admin' ? 'bg-red-50 text-red-700 border-red-100' :
                            u.role === 'HOD' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                              u.role === 'Coordinator' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-slate-100 text-slate-600'
                          }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-600">{u.departmentId?.code || 'None'}</td>
                      <td className="p-4">{u.programId?.code || 'None'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border ${u.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                          {u.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right flex justify-end gap-2">
                        <button
                          onClick={() => setUserModal({ open: true, mode: 'edit', data: { ...u, departmentId: u.departmentId?._id || '', programId: u.programId?._id || '' } })}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUser(u._id)}
                          className={`p-1 hover:bg-slate-100 rounded cursor-pointer ${u.isActive !== false ? 'text-red-500 hover:text-red-700' : 'text-emerald-600'}`}
                          title={u.isActive !== false ? 'Deactivate' : 'Activate'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HOD MANAGEMENT PAGE */}
      {activeTab === 'hod-management' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">HOD Management</h1>
              <p className="text-xs text-slate-500 mt-1">View HODs department-wise along with their automatically assigned regulations.</p>
            </div>
            <button
              onClick={() => setActiveTab('departments')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
            >
              Assign New HOD
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            {users
              .filter(u => u.role === 'HOD' && u.isActive !== false)
              .map(hod => {
                const dept = departments.find(d => d._id === (hod.departmentId?._id || hod.departmentId));
                const deptRegs = dept ? regulations.filter(r => (r.programId?._id || r.programId) === (dept.programId?._id || dept.programId)) : [];

                return (
                  <div key={hod._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>
                    
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg border-2 border-white shadow-sm flex-shrink-0">
                        {hod.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800">{hod.name}</h3>
                        <p className="text-sm text-slate-500 font-medium">{hod.email}</p>
                        
                        {dept ? (
                          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <h4 className="text-sm font-bold text-indigo-700 mb-1">
                              {dept.name} ({dept.code})
                            </h4>
                            
                            <div className="mt-3">
                              <p className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-wider">Assigned Regulations ({deptRegs.length})</p>
                              {deptRegs.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {deptRegs.map(reg => (
                                    <span key={reg._id} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm flex items-center gap-1.5">
                                      <Settings className="w-3 h-3 text-slate-400" />
                                      {reg.code}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">No regulations assigned to this department yet.</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            No department assigned to this HOD.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {users.filter(u => u.role === 'HOD' && u.isActive !== false).length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-400 font-medium">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No HODs found in the system.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'curriculum' && (
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
          ) : builderViewMode === 'edit' ? (
            <div className="space-y-4 animate-fadeIn">
              <button
                onClick={() => setBuilderViewMode('directory')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold cursor-pointer w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Directory
              </button>
              <div className="h-[calc(100vh-140px)]">
                <CurriculumBuilder />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-extrabold text-slate-800">Curriculum Management Directory</h2>
                <p className="text-sm text-slate-500 mt-1">Select a program to browse its departments and access the builder or generated curriculum books.</p>

                {/* Program Selector */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {programs.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => setSelectedDirProgram(p._id)}
                      className={`px-5 py-2.5 rounded-xl font-bold border transition-all cursor-pointer ${
                        selectedDirProgram === p._id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {p.code}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDirProgram && (
                <div className="space-y-8 animate-fadeIn">
                  {departments
                    .filter((d) => d.programId === selectedDirProgram || d.programId?._id === selectedDirProgram)
                    .map((dept) => {
                      const deptRegs = regulations.filter((r) => (r.programId?._id || r.programId) === (dept.programId?._id || dept.programId));
                      if (deptRegs.length === 0) return null;

                      return (
                        <div key={dept._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
                            {dept.name} ({dept.code})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {deptRegs.map((reg) => (
                              <div key={reg._id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors bg-slate-50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100/50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>
                                <h4 className="font-extrabold text-slate-800 text-lg relative z-10">{reg.code}</h4>
                                <p className="text-xs text-slate-500 font-medium mb-4 relative z-10">Academic Year: {reg.academicYear}</p>
                                
                                <div className="flex flex-wrap gap-2 relative z-10">
                                  <button
                                    onClick={() => {
                                      const prog = programs.find((p) => p._id === selectedDirProgram);
                                      if (prog) setSelectedProgram(prog);
                                      setSelectedDepartment(dept);
                                      setSelectedRegulation(reg);
                                      setBookViewMode('view');
                                      setBuilderViewMode('directory');
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      const prog = programs.find((p) => p._id === selectedDirProgram);
                                      if (prog) setSelectedProgram(prog);
                                      setSelectedDepartment(dept);
                                      setSelectedRegulation(reg);
                                      setBuilderViewMode('edit');
                                      setBookViewMode('directory');
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => setCurriculumRemarkModal({ open: true, regId: reg._id })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    Remarks
                                  </button>
                                  <div className="w-full h-px bg-slate-200 my-1"></div>
                                  <button
                                    onClick={() => generateDOCX(`${reg.code} Curriculum Book`, dept, reg)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    Word
                                  </button>
                                  <button
                                    onClick={() => generatePDF(`${reg.code} Curriculum Book`, dept, reg)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    PDF
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 8. APPROVALS QUEUE PAGE */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Approvals Queue</h1>
              <p className="text-xs text-slate-500 mt-1">Review, approve, reject, or return course files and curriculum structures submitted by HODs.</p>
            </div>
            {/* Queue Filters */}
            <div className="flex gap-2">
              {(['Pending', 'HOD Approved', 'Returned', 'All'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setApprovalTabFilter(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${approvalTabFilter === tab
                      ? 'bg-blue-600 border-blue-600 text-white shadow'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/50 uppercase font-bold">
                  <th className="p-4 pl-6">#</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Course Details</th>
                  <th className="p-4">Regulation</th>
                  <th className="p-4">Submitted By</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvalsQueue
                  .filter((v: any) => {
                    if (approvalTabFilter === 'Pending') return v.status === 'Pending Admin' || v.status === 'Pending HOD';
                    if (approvalTabFilter === 'HOD Approved') return v.status === 'Approved';
                    if (approvalTabFilter === 'Returned') return v.status === 'Returned' || v.status === 'Draft';
                    return true;
                  })
                  .map((v, i) => (
                    <tr key={v._id} className="border-b border-slate-100 hover:bg-slate-50/20 text-slate-600 font-medium">
                      <td className="p-4 pl-6 font-bold">{i + 1}</td>
                      <td className="p-4 font-bold text-slate-800">{v.courseId?.departmentId?.name || 'CSE'}</td>
                      <td className="p-4">
                        <span className="block font-mono font-bold text-slate-400">{v.courseId?.code}</span>
                        <span className="font-semibold text-slate-800">{v.courseId?.title}</span>
                      </td>
                      <td className="p-4 font-semibold text-blue-600">{v.regulationId?.code}</td>
                      <td className="p-4 font-semibold">{v.assignedCoordinator?.name || 'HOD CSE'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border ${v.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            v.status.startsWith('Pending') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                              'bg-red-50 text-red-700 border-red-100'
                          }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right flex justify-end gap-1.5">
                        <button
                          onClick={() => setReviewCommentsModal({ open: true, version: v, action: 'Approve' })}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setReviewCommentsModal({ open: true, version: v, action: 'Return' })}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* 12. SETTINGS PAGE */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h1 className="text-xl font-extrabold text-slate-800">Settings</h1>
            <p className="text-xs text-slate-500 mt-1">Configure global university parameters, headers, and accreditation standards.</p>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {/* Navigation options list */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 flex flex-col">
              {['University Profile', 'System Settings', 'Email Settings', 'Report Settings', 'Workflow Settings', 'Security Settings'].map((s, i) => (
                <button
                  key={i}
                  className={`w-full text-left p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${i === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Config Form details */}
            <div className="col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">University Profile Configuration</h3>
              <form className="space-y-4 text-xs font-bold text-slate-500" onSubmit={(e) => { e.preventDefault(); alert('University settings updated successfully!'); }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="uppercase text-[10px]">University Name</span>
                    <input
                      type="text"
                      value={universitySettings.name}
                      onChange={(e) => setUniversitySettings({ ...universitySettings, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="uppercase text-[10px]">Short Code / Abbreviation</span>
                    <input
                      type="text"
                      value={universitySettings.shortName}
                      onChange={(e) => setUniversitySettings({ ...universitySettings, shortName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Official Campus Address</span>
                  <textarea
                    rows={2}
                    value={universitySettings.address}
                    onChange={(e) => setUniversitySettings({ ...universitySettings, address: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="uppercase text-[10px]">Administration Email</span>
                    <input
                      type="email"
                      value={universitySettings.email}
                      onChange={(e) => setUniversitySettings({ ...universitySettings, email: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="uppercase text-[10px]">Contact Helpline Phone</span>
                    <input
                      type="text"
                      value={universitySettings.phone}
                      onChange={(e) => setUniversitySettings({ ...universitySettings, phone: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer"
                >
                  Save Profile Settings
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 13. ADMIN PROFILE PAGE */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Success banner */}
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

          {/* Administrator Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-850">Administrator Information</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage administrative account information.</p>
              </div>
              <div>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer font-sans"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        setShowProfileSuccess(true);
                        setProfileSuccess(true);
                        setTimeout(() => { setShowProfileSuccess(false); setProfileSuccess(false); }, 4000);
                      }}
                      className="px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer font-sans"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        setPhoneVal('+91 9800001234');
                        setAltEmailVal('admin.alt@aditya.edu.in');
                        setProfileImageVal('');
                      }}
                      className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans"
                    >
                      Cancel
                    </button>
                  </div>
                )}
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
                  <strong className="text-slate-800 font-bold text-xs mt-0.5 block">{user?.name || 'Dr. K. V. S. R. Murthy'}</strong>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Role</span>
                  <strong className="text-slate-800 font-bold text-xs mt-0.5 block">ERP Administrator</strong>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Official Email</span>
                  <strong className="text-slate-855 font-mono text-xs mt-0.5 block">{user?.email || 'admin@aditya.edu.in'}</strong>
                </div>
              </div>

              {/* Employee ID */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Employee ID</span>
                  <strong className="text-slate-800 font-mono text-xs mt-0.5 block">ADM-001</strong>
                </div>
              </div>

              {/* University Branch */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">University Branch</span>
                  <strong className="text-slate-800 font-bold text-xs mt-0.5 block">Aditya University Campus</strong>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Phone Number</span>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={phoneVal}
                      onChange={(e) => setPhoneVal(e.target.value)}
                      className="border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none mt-1 bg-white"
                    />
                  ) : (
                    <strong className="text-slate-800 font-mono text-xs mt-0.5 block">{phoneVal}</strong>
                  )}
                </div>
              </div>

              {/* Alternate Email */}
              <div className="flex items-center gap-3 col-span-1">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Alternate Email</span>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={altEmailVal}
                      onChange={(e) => setAltEmailVal(e.target.value)}
                      className="border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none mt-1 bg-white w-full max-w-[220px]"
                    />
                  ) : (
                    <strong className="text-slate-855 font-mono text-xs mt-0.5 block truncate">{altEmailVal}</strong>
                  )}
                </div>
              </div>

              {/* Profile Image */}
              <div className="flex items-center gap-3 col-span-1">
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {profileImageVal ? (
                    <img src={profileImageVal} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4.5 h-4.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Profile Image</span>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileImageVal}
                      onChange={(e) => setProfileImageVal(e.target.value)}
                      placeholder="Image URL..."
                      className="border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none mt-1 bg-white w-full max-w-[220px]"
                    />
                  ) : (
                    <strong className="text-slate-800 font-mono text-xs mt-0.5 block truncate">{profileImageVal ? 'Custom Image Set' : 'Default Initials'}</strong>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-855">Preferences</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Customize your Administrator experience.</p>
            </div>

            <div className="divide-y divide-slate-100">

              {/* Toggle 1 */}
              <div className="py-4 first:pt-0 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800">System Alerts</h4>
                  <p className="text-slate-500 font-medium">Receive critical system health and status notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemAlerts}
                    onChange={(e) => setSystemAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-255 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Toggle 2 */}
              <div className="py-4 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800">User Registration Notifications</h4>
                  <p className="text-slate-500 font-medium">Get notified when new faculty or HOD accounts are created</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userRegistrationNotif}
                    onChange={(e) => setUserRegistrationNotif(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-255 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Toggle 3 */}
              <div className="py-4 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800">ERP Maintenance Updates</h4>
                  <p className="text-slate-500 font-medium">Receive alerts for scheduled portal maintenance windows</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={erpMaintenanceUpdates}
                    onChange={(e) => setErpMaintenanceUpdates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-255 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Toggle 4 */}
              <div className="py-4 last:pb-0 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800">Backup Completion Notifications</h4>
                  <p className="text-slate-500 font-medium">Get notified when database backups complete successfully</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backupCompletionNotif}
                    onChange={(e) => setBackupCompletionNotif(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-255 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
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
              <div className="py-4 first:pt-0 flex justify-between items-center">
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

              {/* Two Factor Authentication */}
              <div className="py-4 flex justify-between items-center">
                <div className="space-y-0.5 text-left">
                  <h4 className="font-bold text-slate-800">Two Factor Authentication (2FA)</h4>
                  <p className="text-slate-500 font-medium font-sans">Add an extra layer of security to your ERP account</p>
                </div>
                <button className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-bold shadow-sm cursor-pointer">
                  Enable 2FA
                </button>
              </div>

              {/* Logout from all devices */}
              <div className="py-4 last:pb-0 flex justify-between items-center">
                <div className="space-y-0.5 text-left">
                  <h4 className="font-bold text-slate-800">Logout from All Devices</h4>
                  <p className="text-slate-500 font-medium font-sans">Terminate all active admin sessions across all devices</p>
                </div>
                <button
                  onClick={() => alert('All sessions have been terminated.')}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  Logout All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL POPUPS */}
      {/* ============================================================== */}

      {/* PROGRAM ADD/EDIT MODAL */}
      {programModal.open && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-[500px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>{programModal.mode === 'add' ? 'Add Academic Program' : 'Edit Academic Program'}</span>
              </h3>
              <button onClick={() => setProgramModal({ open: false, mode: 'add', data: {} })} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleProgramSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Program Code</span>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech"
                    value={programModal.data.code}
                    onChange={(e) => setProgramModal({ ...programModal, data: { ...programModal.data, code: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Program Name</span>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={programModal.data.name}
                    onChange={(e) => setProgramModal({ ...programModal, data: { ...programModal.data, name: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Degree</span>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech"
                    value={programModal.data.degree}
                    onChange={(e) => setProgramModal({ ...programModal, data: { ...programModal.data, degree: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Total Credits</span>
                  <input
                    type="number"
                    value={programModal.data.totalCredits}
                    onChange={(e) => setProgramModal({ ...programModal, data: { ...programModal.data, totalCredits: parseInt(e.target.value) } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Duration (Years)</span>
                  <input
                    type="number"
                    value={programModal.data.duration}
                    onChange={(e) => setProgramModal({ ...programModal, data: { ...programModal.data, duration: parseInt(e.target.value) } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">No of Semesters</span>
                  <input
                    type="number"
                    value={programModal.data.numberOfSemesters || ''}
                    onChange={(e) => setProgramModal({ ...programModal, data: { ...programModal.data, numberOfSemesters: parseInt(e.target.value) } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Program Description</span>
                  <input
                    type="text"
                    placeholder="Brief description..."
                    value={programModal.data.description}
                    onChange={(e) => setProgramModal({ ...programModal, data: { ...programModal.data, description: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="uppercase text-[10px]">Vision</span>
                <textarea
                  rows={2}
                  placeholder="Program vision statement..."
                  value={programModal.data.vision}
                  onChange={(e) => setProgramModal({ ...programModal, data: { ...programModal.data, vision: e.target.value } })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="space-y-1">
                <span className="uppercase text-[10px]">Mission</span>
                <textarea
                  rows={2}
                  placeholder="Program mission statement..."
                  value={programModal.data.mission}
                  onChange={(e) => setProgramModal({ ...programModal, data: { ...programModal.data, mission: e.target.value } })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setProgramModal({ open: false, mode: 'add', data: {} })}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow cursor-pointer text-center"
                >
                  Confirm Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPARTMENT ADD/EDIT MODAL */}
      {deptModal.open && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-[500px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Building className="w-5 h-5 text-blue-600" />
                <span>{deptModal.mode === 'add' ? 'Add Academic Department' : 'Edit Academic Department'}</span>
              </h3>
              <button onClick={() => setDeptModal({ open: false, mode: 'add', data: {} })} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleDeptSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Department Code</span>
                  <input
                    type="text"
                    placeholder="e.g. CSE"
                    value={deptModal.data.code}
                    onChange={(e) => setDeptModal({ ...deptModal, data: { ...deptModal.data, code: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Department Name</span>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science Engineering"
                    value={deptModal.data.name}
                    onChange={(e) => setDeptModal({ ...deptModal, data: { ...deptModal.data, name: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="uppercase text-[10px]">Select Program</span>
                <Select
                  options={programs.map(p => ({ value: p._id, label: `${p.code} - ${p.name}` }))}
                  value={programs.filter(p => p._id === deptModal.data.programId).map(p => ({ value: p._id, label: `${p.code} - ${p.name}` }))}
                  onChange={(selected: any) => setDeptModal({ ...deptModal, data: { ...deptModal.data, programId: selected?.value, regulationId: '' } })}
                  placeholder="Choose a program..."
                  styles={{ control: (base) => ({ ...base, borderColor: '#cbd5e1', padding: '2px', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }) }}
                  required
                />
              </div>



              <div className="space-y-1">
                <span className="uppercase text-[10px]">Department Description</span>
                <textarea
                  rows={2}
                  placeholder="Accreditation scope and details..."
                  value={deptModal.data.description}
                  onChange={(e) => setDeptModal({ ...deptModal, data: { ...deptModal.data, description: e.target.value } })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDeptModal({ open: false, mode: 'add', data: {} })}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow cursor-pointer text-center"
                >
                  Confirm Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN HOD MODAL */}
      {assignHodModal.open && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-[500px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-200" />
                <span className="font-bold">Assign Head of Department</span>
              </div>
              <button onClick={() => setAssignHodModal({ open: false, data: { programId: '', departmentId: '', userId: '' } })} className="text-indigo-200 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignHodSubmit} className="p-6 space-y-5">
              <div className="space-y-1">
                <span className="uppercase text-[10px] font-bold text-slate-400">Program *</span>
                <select
                  value={assignHodModal.data.programId}
                  onChange={(e) => setAssignHodModal({ ...assignHodModal, data: { ...assignHodModal.data, programId: e.target.value, departmentId: '' } })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  required
                >
                  <option value="">Select Program</option>
                  {programs.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="uppercase text-[10px] font-bold text-slate-400">Department *</span>
                <select
                  value={assignHodModal.data.departmentId}
                  onChange={(e) => setAssignHodModal({ ...assignHodModal, data: { ...assignHodModal.data, departmentId: e.target.value } })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  required
                  disabled={!assignHodModal.data.programId}
                >
                  <option value="">Select Department</option>
                  {departments.filter(d => d.programId?._id === assignHodModal.data.programId || d.programId === assignHodModal.data.programId).map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="uppercase text-[10px] font-bold text-slate-400">Select HOD (User) *</span>
                <select
                  value={assignHodModal.data.userId}
                  onChange={(e) => setAssignHodModal({ ...assignHodModal, data: { ...assignHodModal.data, userId: e.target.value } })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  required
                  disabled={!assignHodModal.data.departmentId}
                >
                  <option value="">Select User</option>
                  {users.filter(u => u.role !== 'Admin').map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setAssignHodModal({ open: false, data: { programId: '', departmentId: '', userId: '' } })} className="px-4 py-2 text-slate-500 hover:bg-slate-50 font-semibold rounded-lg text-sm transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm cursor-pointer">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGULATION ADD/EDIT MODAL */}
      {regModal.open && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-[500px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>{regModal.mode === 'add' ? 'Add Regulation Scheme' : 'Edit Regulation Scheme'}</span>
              </h3>
              <button onClick={() => setRegModal({ open: false, mode: 'add', data: {} })} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleRegSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-500">
              <div className="space-y-1">
                <span className="uppercase text-[10px]">Program Context</span>
                <select
                  value={regModal.data.programId}
                  onChange={(e) => setRegModal({ ...regModal, data: { ...regModal.data, programId: e.target.value } })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">-- Select Program --</option>
                  {programs.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Regulation Code</span>
                  <input
                    type="text"
                    placeholder="e.g. R24"
                    value={regModal.data.code}
                    onChange={(e) => setRegModal({ ...regModal, data: { ...regModal.data, code: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Academic Year</span>
                  <input
                    type="number"
                    value={regModal.data.academicYear}
                    onChange={(e) => setRegModal({ ...regModal, data: { ...regModal.data, academicYear: parseInt(e.target.value) } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Duration (Years)</span>
                  <input
                    type="number"
                    value={regModal.data.durationYears}
                    onChange={(e) => setRegModal({ ...regModal, data: { ...regModal.data, durationYears: parseInt(e.target.value) } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Total Semesters</span>
                  <input
                    type="number"
                    value={regModal.data.semesterCount}
                    onChange={(e) => setRegModal({ ...regModal, data: { ...regModal.data, semesterCount: parseInt(e.target.value) } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setRegModal({ open: false, mode: 'add', data: {} })}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow cursor-pointer text-center"
                >
                  Confirm Regulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER MANAGEMENT ADD/EDIT MODAL */}
      {userModal.open && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-[500px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>{userModal.mode === 'add' ? 'Register New User account' : 'Modify User Details'}</span>
              </h3>
              <button onClick={() => setUserModal({ open: false, mode: 'add', data: {} })} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4 text-xs font-bold text-slate-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Full Name</span>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ramesh"
                    value={userModal.data.name}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, name: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Email Address</span>
                  <input
                    type="email"
                    placeholder="email@aditya.edu.in"
                    value={userModal.data.email}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, email: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
              </div>

              {userModal.mode === 'add' && (
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Password</span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={userModal.data.password}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, password: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">User Role</span>
                  <select
                    value={userModal.data.role}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, role: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="Admin">Admin</option>
                    <option value="HOD">HOD</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="uppercase text-[10px]">Department Access</span>
                  <select
                    value={userModal.data.departmentId}
                    onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, departmentId: e.target.value } })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="">None (Admin Only)</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="uppercase text-[10px]">Program Access Context</span>
                <select
                  value={userModal.data.programId}
                  onChange={(e) => setUserModal({ ...userModal, data: { ...userModal.data, programId: e.target.value } })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">None</option>
                  {programs.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setUserModal({ open: false, mode: 'add', data: {} })}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow cursor-pointer text-center"
                >
                  Confirm User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CURRICULUM REMARKS MODAL */}
      {curriculumRemarkModal.open && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-[480px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                Send Remarks to HOD
              </h3>
              <button onClick={() => setCurriculumRemarkModal({ open: false, regId: null })} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendRemark} className="p-6 space-y-4 text-xs font-bold text-slate-500">
              <div className="space-y-1">
                <label>Remarks / Feedback</label>
                <textarea
                  value={curriculumRemark}
                  onChange={(e) => setCurriculumRemark(e.target.value)}
                  placeholder="Enter remarks to notify the HOD about this curriculum book..."
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 outline-none focus:ring-1 focus:ring-blue-700 resize-none font-medium text-sm"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCurriculumRemarkModal({ open: false, regId: null })}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow cursor-pointer text-center"
                >
                  Send Remarks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW & DECISION COMMENTS MODAL */}
      {reviewCommentsModal.open && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-[480px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                {reviewCommentsModal.action} Submissions Review
              </h3>
              <button onClick={() => setReviewCommentsModal({ open: false, version: null, action: 'Approve' })} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={handleWorkflowSubmission} className="p-6 space-y-4 text-xs font-bold text-slate-500">
              <div className="space-y-1">
                <span className="uppercase text-[10px]">Add Comments / Review feedback</span>
                <textarea
                  rows={4}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Enter comments details..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReviewCommentsModal({ open: false, version: null, action: 'Approve' })}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white rounded-lg font-bold shadow cursor-pointer text-center ${reviewCommentsModal.action === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'
                    }`}
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROGRAM REGULATIONS MODAL */}
      {programRegModal.open && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-[600px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Regulations for {programRegModal.program?.name}</span>
              </h3>
              <button onClick={() => setProgramRegModal({ open: false, program: null, regulations: [] })} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="p-6">
              {programRegModal.regulations.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No regulations found for this program.</p>
              ) : (
                <div className="space-y-3">
                  {programRegModal.regulations.map((reg) => (
                    <div key={reg._id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <h4 className="font-bold text-slate-800">{reg.code} Regulation</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Academic Year: {reg.academicYear} • Duration: {reg.durationYears} Years</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${reg.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : reg.status === 'Archived'
                          ? 'bg-red-50 text-red-700 border-red-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                        {reg.status || 'Draft'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
