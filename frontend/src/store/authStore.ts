import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

// Increment this version whenever the JWT secret or token structure changes.
// Mismatched version wipes stale storage tokens automatically on next page load.
const AUTH_VERSION = '3';

export const useAuthStore = create<AuthState>((set) => {
  // Version-check: clear stale auth data if session version doesn't match
  const storedVersion = sessionStorage.getItem('obcpmp_version');
  if (storedVersion !== AUTH_VERSION) {
    sessionStorage.removeItem('obcpmp_user');
    sessionStorage.removeItem('obcpmp_access');
    sessionStorage.removeItem('obcpmp_refresh');
    sessionStorage.setItem('obcpmp_version', AUTH_VERSION);

    // Clean up any lingering localStorage from previous versions (for production readiness)
    localStorage.removeItem('obcpmp_user');
    localStorage.removeItem('obcpmp_access');
    localStorage.removeItem('obcpmp_refresh');
    localStorage.removeItem('obcpmp_version');
  }

  // Try to load initial auth data from sessionStorage
  const savedUser = sessionStorage.getItem('obcpmp_user');
  const savedAccess = sessionStorage.getItem('obcpmp_access');
  const savedRefresh = sessionStorage.getItem('obcpmp_refresh');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    accessToken: savedAccess || null,
    refreshToken: savedRefresh || null,
    isAuthenticated: !!savedAccess,

    login: (user, accessToken, refreshToken) => {
      sessionStorage.setItem('obcpmp_version', AUTH_VERSION);
      sessionStorage.setItem('obcpmp_user', JSON.stringify(user));
      sessionStorage.setItem('obcpmp_access', accessToken);
      sessionStorage.setItem('obcpmp_refresh', refreshToken);
      set({ user, accessToken, refreshToken, isAuthenticated: true });
    },

    logout: () => {
      sessionStorage.removeItem('obcpmp_user');
      sessionStorage.removeItem('obcpmp_access');
      sessionStorage.removeItem('obcpmp_refresh');
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    },

    setAccessToken: (token) => {
      sessionStorage.setItem('obcpmp_access', token);
      set({ accessToken: token });
    }
  };
});
