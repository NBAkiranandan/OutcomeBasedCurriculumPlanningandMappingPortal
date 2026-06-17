import { create } from 'zustand';
import { Program, Department, Regulation } from '../types';

interface ContextState {
  programs: Program[];
  departments: Department[];
  regulations: Regulation[];
  selectedProgram: Program | null;
  selectedDepartment: Department | null;
  selectedRegulation: Regulation | null;
  setPrograms: (programs: Program[]) => void;
  setDepartments: (departments: Department[]) => void;
  setRegulations: (regulations: Regulation[]) => void;
  setSelectedProgram: (program: Program | null) => void;
  setSelectedDepartment: (dept: Department | null) => void;
  setSelectedRegulation: (reg: Regulation | null) => void;
}

export const useContextStore = create<ContextState>((set) => ({
  programs: [],
  departments: [],
  regulations: [],
  selectedProgram: null,
  selectedDepartment: null,
  selectedRegulation: null,

  setPrograms: (programs) => set({ programs }),
  setDepartments: (departments) => set({ departments }),
  setRegulations: (regulations) => set({ regulations }),
  
  setSelectedProgram: (program) => set({ selectedProgram: program }),
  setSelectedDepartment: (selectedDepartment) => set({ selectedDepartment }),
  setSelectedRegulation: (selectedRegulation) => set({ selectedRegulation })
}));
