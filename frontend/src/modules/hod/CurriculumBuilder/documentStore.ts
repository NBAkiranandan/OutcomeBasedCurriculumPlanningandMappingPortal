import { create } from 'zustand';
import { api } from '../../../services/api';
import { useContextStore } from '../../../store/contextStore';

export interface CourseData {
  _id: string;
  code: string;
  title: string;
  category: string;
  L: number;
  T: number;
  P: number;
  S: number;
  credits: number;
}

export interface SemesterData {
  semester: number;
  courses: CourseData[];
  notes?: string;
}

export interface CurriculumBuilderState {
  // Document State
  department: string;
  program: string;
  regulation: string;
  academicYear: string;
  scheme: string;
  durationYears: number;
  totalCredits: number;
  vision: string;
  mission: string;
  peos: string[];
  psos: string[];
  semesters: SemesterData[];
  isLoading: boolean;
  error: string | null;

  // Editor State
  activeSectionId: string;
  zoomLevel: number;
  lastSaved: Date | null;
  isSaving: boolean;
  
  // Modals
  courseSelectorOpen: boolean;
  targetSemesterForCourse: number | null;

  // Actions
  setField: (field: keyof CurriculumBuilderState, value: any) => void;
  loadCurriculum: (regulationId: string, departmentId?: string) => Promise<void>;
  updatePeo: (index: number, value: string) => void;
  addPeo: () => void;
  removePeo: (index: number) => void;
  updatePso: (index: number, value: string) => void;
  addPso: () => void;
  removePso: (index: number) => void;
  addCourseToSemester: (semesterNum: number, course: CourseData) => void;
  removeCourseFromSemester: (semesterNum: number, courseId: string) => void;
  reorderCourseInSemester: (semesterNum: number, oldIndex: number, newIndex: number) => void;
  updateSemesterNotes: (semesterNum: number, notes: string) => void;
  savePeoPso: () => void;
  
  setActiveSection: (id: string) => void;
  setZoom: (zoom: number) => void;
  openCourseSelector: (semesterNum: number) => void;
  closeCourseSelector: () => void;
}

let saveTimeout: any = null;
const debouncedSavePeoPso = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    useCurriculumBuilderStore.getState().savePeoPso();
  }, 1500);
};

export const useCurriculumBuilderStore = create<CurriculumBuilderState>((set) => ({
  department: 'Computer Science & Engineering',
  program: 'B.Tech',
  regulation: 'R24',
  academicYear: '2024-2025',
  scheme: '2024',
  durationYears: 4,
  totalCredits: 160,
  vision: 'To be a center of excellence in computer science education...',
  mission: 'M1: Provide quality education.\nM2: Foster research and innovation.',
  peos: [],
  psos: [],
  semesters: Array.from({ length: 8 }, (_, i) => ({ semester: i + 1, courses: [] })),

  activeSectionId: 'cover',
  zoomLevel: 100,
  lastSaved: new Date(),
  isSaving: false,
  courseSelectorOpen: false,
  targetSemesterForCourse: null,
  isLoading: false,
  error: null,

  setField: (field, value) => set({ [field]: value, lastSaved: new Date() }),
  loadCurriculum: async (regulationId, departmentId) => {
    set({ isLoading: true, error: null });

    try {
      const data = await api.curriculum.getFull(regulationId, departmentId);
      const semesters = (data.semesters || []).map((semester: any) => ({
        semester: semester.semester,
        courses: (semester.courses || []).map((course: any) => ({
          _id: course._id,
          code: course.code,
          title: course.title,
          category: course.category,
          L: course.credits?.L || 0,
          T: course.credits?.T || 0,
          P: course.credits?.P || 0,
          S: course.credits?.S || 0,
          credits: course.credits?.C || 0
        }))
      }));

      // Fetch PEOs and PSOs from the Department's dynamically configured outcomes
      const { selectedDepartment } = useContextStore.getState();
      let peoStrings: string[] = [];
      let psoStrings: string[] = [];
      
      if (selectedDepartment && selectedDepartment.outcomes) {
        const peoGroup = selectedDepartment.outcomes.find((o: any) => o.name === 'PEO');
        if (peoGroup && peoGroup.items) {
          peoStrings = peoGroup.items.map((i: any) => `${i.code}: ${i.description}`);
        }
        
        const psoGroup = selectedDepartment.outcomes.find((o: any) => o.name === 'PSO');
        if (psoGroup && psoGroup.items) {
          psoStrings = psoGroup.items.map((i: any) => `${i.code}: ${i.description}`);
        }
      }

      set({
        department: data.department?.name || 'Computer Science & Engineering',
        program: data.program?.name || 'B.Tech',
        regulation: data.regulation?.code || 'R24',
        academicYear: data.regulation ? `${data.regulation.academicYear}-${data.regulation.academicYear + 1}` : '2024-2025',
        totalCredits: data.totalCredits || 160,
        semesters,
        peos: peoStrings,
        psos: psoStrings,
        isLoading: false,
        error: null,
        lastSaved: new Date()
      });
    } catch (err: any) {
      console.error('[CurriculumBuilder Store] Failed to load curriculum:', err);
      set({ error: err.message || 'Failed to load curriculum.', isLoading: false });
    }
  },
  
  updatePeo: (index, value) => set((state) => {
    const newPeos = [...state.peos];
    newPeos[index] = value;
    debouncedSavePeoPso();
    return { peos: newPeos, lastSaved: new Date() };
  }),
  addPeo: () => set((state) => {
    const newPeos = [...state.peos, ''];
    debouncedSavePeoPso();
    return { peos: newPeos, lastSaved: new Date() };
  }),
  removePeo: (index) => set((state) => {
    const newPeos = state.peos.filter((_, i) => i !== index);
    debouncedSavePeoPso();
    return { peos: newPeos, lastSaved: new Date() };
  }),

  updatePso: (index, value) => set((state) => {
    const newPsos = [...state.psos];
    newPsos[index] = value;
    debouncedSavePeoPso();
    return { psos: newPsos, lastSaved: new Date() };
  }),
  addPso: () => set((state) => {
    const newPsos = [...state.psos, ''];
    debouncedSavePeoPso();
    return { psos: newPsos, lastSaved: new Date() };
  }),
  removePso: (index) => set((state) => {
    const newPsos = state.psos.filter((_, i) => i !== index);
    debouncedSavePeoPso();
    return { psos: newPsos, lastSaved: new Date() };
  }),

  addCourseToSemester: (semesterNum, course) => {
    const { selectedRegulation, selectedDepartment } = useContextStore.getState();
    if (!selectedRegulation || !selectedDepartment) return;

    set({ isSaving: true });
    api.courses.create({
      code: course.code,
      title: course.title,
      departmentId: selectedDepartment._id,
      regulationId: selectedRegulation._id,
      semester: semesterNum
    }).then(() => {
      set((state) => {
        const sems = [...state.semesters];
        const semIndex = sems.findIndex(s => s.semester === semesterNum);
        if (semIndex >= 0) {
          if (!sems[semIndex].courses.some(c => c._id === course._id)) {
            sems[semIndex] = { ...sems[semIndex], courses: [...sems[semIndex].courses, course] };
          }
        }
        return { semesters: sems, lastSaved: new Date(), courseSelectorOpen: false, targetSemesterForCourse: null, isSaving: false };
      });
    }).catch((err) => {
      console.error('[CurriculumBuilder Store] Failed to add course:', err);
      set({ isSaving: false });
      alert(`Failed to add course to curriculum: ${err.message}`);
    });
  },

  removeCourseFromSemester: (semesterNum, courseId) => {
    const { selectedRegulation } = useContextStore.getState();
    if (!selectedRegulation) return;

    set({ isSaving: true });
    api.courses.listByReg(selectedRegulation._id).then((verRes) => {
      const version = (verRes.versions || []).find((v: any) => (v.courseId?._id || v.courseId) === courseId);
      if (version) {
        api.courses.deleteVersion(version._id).then(() => {
          set((state) => {
            const sems = [...state.semesters];
            const semIndex = sems.findIndex(s => s.semester === semesterNum);
            if (semIndex >= 0) {
              sems[semIndex] = { ...sems[semIndex], courses: sems[semIndex].courses.filter(c => c._id !== courseId) };
            }
            return { semesters: sems, lastSaved: new Date(), isSaving: false };
          });
        }).catch((err) => {
          console.error('[CurriculumBuilder Store] Failed to delete course version:', err);
          set({ isSaving: false });
          alert(`Failed to remove course: ${err.message}`);
        });
      } else {
        set({ isSaving: false });
      }
    }).catch((err) => {
      console.error('[CurriculumBuilder Store] Failed to list course versions:', err);
      set({ isSaving: false });
    });
  },

  reorderCourseInSemester: (semesterNum, oldIndex, newIndex) => set((state) => {
    const sems = [...state.semesters];
    const semIndex = sems.findIndex(s => s.semester === semesterNum);
    if (semIndex >= 0) {
      const courses = Array.from(sems[semIndex].courses);
      const [removed] = courses.splice(oldIndex, 1);
      courses.splice(newIndex, 0, removed);
      sems[semIndex] = { ...sems[semIndex], courses };
    }
    return { semesters: sems, lastSaved: new Date() };
  }),

  updateSemesterNotes: (semesterNum, notes) => set((state) => {
    const sems = [...state.semesters];
    const semIndex = sems.findIndex(s => s.semester === semesterNum);
    if (semIndex >= 0) {
      sems[semIndex] = { ...sems[semIndex], notes };
    }
    return { semesters: sems, lastSaved: new Date() };
  }),

  savePeoPso: async () => {
    const { peos, psos } = useCurriculumBuilderStore.getState();
    const { selectedDepartment, selectedRegulation } = useContextStore.getState();
    if (!selectedDepartment) return;

    set({ isSaving: true });
    try {
      const parsedPeos = peos.map(p => {
        const parts = p.split(':');
        const code = parts[0]?.trim() || '';
        const description = parts.slice(1).join(':').trim() || '';
        return { code, description };
      }).filter(p => p.code && p.description);

      const parsedPsos = psos.map(p => {
        const parts = p.split(':');
        const code = parts[0]?.trim() || '';
        const description = parts.slice(1).join(':').trim() || '';
        return { code, description };
      }).filter(p => p.code && p.description);

      // Sync with the central Department outcomes model
      const outcomes = selectedDepartment.outcomes || [];
      const peoIndex = outcomes.findIndex((o: any) => o.name === 'PEO');
      const psoIndex = outcomes.findIndex((o: any) => o.name === 'PSO');

      if (peoIndex > -1) outcomes[peoIndex].items = parsedPeos;
      else outcomes.push({ name: 'PEO', isGlobal: false, isLocal: true, isMapped: false, items: parsedPeos });

      if (psoIndex > -1) outcomes[psoIndex].items = parsedPsos;
      else outcomes.push({ name: 'PSO', isGlobal: false, isLocal: true, isMapped: false, items: parsedPsos });

      await api.programs.updateDept(selectedDepartment._id, { outcomes });
      
      // Also update the local context store so it reflects immediately
      useContextStore.getState().setSelectedDepartment({ ...selectedDepartment, outcomes });

      set({ isSaving: false, lastSaved: new Date() });
    } catch (err) {
      console.error('[CurriculumBuilder Store] Failed to save PEOs/PSOs:', err);
      set({ isSaving: false });
    }
  },

  setActiveSection: (id) => set({ activeSectionId: id }),
  setZoom: (zoom) => set({ zoomLevel: zoom }),
  openCourseSelector: (semesterNum) => set({ courseSelectorOpen: true, targetSemesterForCourse: semesterNum }),
  closeCourseSelector: () => set({ courseSelectorOpen: false, targetSemesterForCourse: null }),
}));
