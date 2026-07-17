import { create } from 'zustand';

interface UIState {
  // Profile update success — shared across all roles
  profileSuccess: boolean;
  setProfileSuccess: (val: boolean) => void;

  // Generic page-level loading flag
  pageLoading: boolean;
  setPageLoading: (val: boolean) => void;

  // Password reset modal global state
  changePasswordModalOpen: boolean;
  setChangePasswordModalOpen: (val: boolean) => void;

  // Active course version being edited (shared for navigation layout)
  activeCourseVersion: any;
  setActiveCourseVersion: (val: any) => void;

  // Clears ALL transient UI state (called on every tab navigation)
  clearTransientState: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  profileSuccess: false,
  pageLoading: false,
  changePasswordModalOpen: false,
  activeCourseVersion: null,

  setProfileSuccess: (val) => set({ profileSuccess: val }),
  setPageLoading: (val) => set({ pageLoading: val }),
  setChangePasswordModalOpen: (val) => set({ changePasswordModalOpen: val }),
  setActiveCourseVersion: (val) => set({ activeCourseVersion: val }),

  clearTransientState: () =>
    set({ profileSuccess: false, pageLoading: false, changePasswordModalOpen: false }),
}));
